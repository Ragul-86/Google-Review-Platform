import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewRequestsAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardCheck, Search, MoreVertical, Eye, Check, X, Gift,
  Star, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  UserPlus, Copy, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Status configs ───────────────────────────────────────────── */
const REQUEST_STATUS = {
  pending:  { label: 'Pending Verification', variant: 'warning' },
  approved: { label: 'Approved',             variant: 'success' },
  rejected: { label: 'Rejected',             variant: 'destructive' },
};

const TABS = [
  { key: '',         label: 'All Requests' },
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Stars({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < n ? 'fill-amber-400 text-amber-400' : 'text-gray-200')}
        />
      ))}
    </div>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(`${label} copied`);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center justify-center h-6 w-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* A request with no phone has no contact details yet — customerName always
   carries a non-empty default ('Anonymous Customer'), so phone is the only
   reliable "missing details" signal. */
const isUnassigned = (r) => !r?.phone;

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('h-4.5 w-4.5', color)} />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Build the pre-filled WhatsApp message.
   GETMORE never sends this automatically — it only opens WhatsApp Web /
   the WhatsApp app with the secure link pre-filled. The reward itself is
   NOT revealed here — the customer only finds out what they won after
   they scratch the card on the link themselves. The client must press
   Send themselves inside WhatsApp. ───────────────────────────────── */
function buildScratchCardMessage({ customerName, businessName, scratchCardUrl }) {
  const biz = businessName || 'Our Team';
  return `Hi ${customerName},\n\nThank you for reviewing ${biz}.\nYour Scratch Card is ready.\nClick the secure link below to reveal your reward.\n\n${scratchCardUrl}\n\nThis reward can be opened only once.\n\nRegards,\n${biz}`;
}

/* ═══════════════════════════════════════════════════════════════
   Review Verification — every "I've Submitted My Review" click from
   the public review page lands here as Pending. The client manually
   verifies it (Approve / Reject) and only then can send a secure,
   one-time Scratch Card link over WhatsApp. GETMORE never sends
   rewards or WhatsApp messages automatically. ═══════════════════ */
export default function ReviewVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const businessName = user?.client?.businessName;

  const [statusTab, setStatusTab] = useState('');
  const [search, setSearch]       = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage]           = useState(1);
  const [viewTarget, setViewTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignForm, setAssignForm] = useState({ customerName: '', phone: '', email: '' });
  const limit = 15;

  function openAssign(r) {
    setAssignTarget(r);
    setAssignForm({ customerName: '', phone: '', email: '' });
  }

  const { data, isLoading } = useQuery({
    queryKey: ['review-requests', statusTab, search, dateRange, page],
    queryFn: () => reviewRequestsAPI.getAll({
      status: statusTab, search, dateRange, page, limit,
    }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['review-requests'] });

  const assignMut = useMutation({
    mutationFn: ({ id, data }) => reviewRequestsAPI.assignCustomer(id, data),
    onSuccess: () => {
      toast.success('Customer details saved');
      invalidate();
      setAssignTarget(null);
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to save customer details'),
  });

  const approveMut = useMutation({
    mutationFn: reviewRequestsAPI.approve,
    onSuccess: () => { toast.success('Review request approved'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to approve'),
  });

  const rejectMut = useMutation({
    mutationFn: reviewRequestsAPI.reject,
    onSuccess: () => { toast.success('Review request rejected'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to reject'),
  });

  const sendMut = useMutation({
    mutationFn: reviewRequestsAPI.sendScratchCard,
    onSuccess: (res) => {
      const { token, customerName, phone, businessName: biz } = res.data.data;
      const scratchCardUrl = `${window.location.origin}/reward/${token}`;
      const message = buildScratchCardMessage({ customerName, businessName: biz || businessName, scratchCardUrl });
      const digits = (phone || '').replace(/\D/g, '');
      if (!digits) { toast.error('No phone number on file for this customer'); return; }
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      toast.success('Scratch Card link ready — press Send inside WhatsApp');
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create Scratch Card link'),
  });

  const requests = data?.data ?? [];
  const counts   = data?.counts ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
  const pages    = data?.pages ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review Verification"
        subtitle="Manually verify customer review submissions before sending their Scratch Card reward"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={ClipboardCheck} label="Total Requests" value={counts.total}    color="text-gray-600"  bg="bg-gray-100" />
        <StatCard icon={Clock}          label="Pending"        value={counts.pending}  color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard icon={CheckCircle2}   label="Approved"       value={counts.approved} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={XCircle}        label="Rejected"       value={counts.rejected} color="text-red-600"   bg="bg-red-50" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatusTab(t.key); setPage(1); }}
              className={cn(
                'px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all',
                statusTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Name, phone, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={dateRange || 'all'} onValueChange={(v) => { setDateRange(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardCheck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-400">No review requests found</p>
              <p className="text-sm text-gray-300 mt-1">Customers who click "I've Submitted My Review" show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Selected Category</TableHead>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => {
                    const rs = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pending;
                    const alreadySent = !!r.rewardTransactionId;
                    return (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium text-gray-900">
                          {isUnassigned(r) ? (
                            <button
                              type="button"
                              onClick={() => openAssign(r)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 hover:border-amber-400 transition-colors"
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Assign Customer
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{r.customerName}</span>
                              <CopyButton value={r.customerName} label="Customer Name" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {r.phone ? (
                            <div className="flex items-center gap-1">
                              <span>{r.phone}</span>
                              <CopyButton value={r.phone} label="Mobile Number" />
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {r.email ? (
                            <div className="flex items-center gap-1">
                              <span>{r.email}</span>
                              <CopyButton value={r.email} label="Email" />
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell><Stars n={r.rating} /></TableCell>
                        <TableCell className="text-gray-600">{r.category || '—'}</TableCell>
                        <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.reviewDate || r.createdAt)}</TableCell>
                        <TableCell><Badge variant={rs.variant}>{rs.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewTarget(r)}>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              {r.status !== 'approved' && (
                                <DropdownMenuItem onClick={() => approveMut.mutate(r._id)}>
                                  <Check className="h-4 w-4 mr-2" /> Approve
                                </DropdownMenuItem>
                              )}
                              {r.status !== 'rejected' && (
                                <DropdownMenuItem onClick={() => rejectMut.mutate(r._id)}>
                                  <X className="h-4 w-4 mr-2" /> Reject
                                </DropdownMenuItem>
                              )}
                              {r.status === 'approved' && (
                                <DropdownMenuItem onClick={() => sendMut.mutate(r._id)}>
                                  <Gift className="h-4 w-4 mr-2" /> {alreadySent ? 'Resend Scratch Card' : 'Send Scratch Card'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── View Details dialog ─────────────────────────────────── */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review Request Details</DialogTitle></DialogHeader>
          {viewTarget && (() => {
            const alreadySent = !!viewTarget.rewardTransactionId;
            return (
              <div className="space-y-3 text-sm">
                {isUnassigned(viewTarget) ? (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-4 text-center space-y-2.5">
                    <p className="text-xs text-amber-700">No customer details on file for this review yet.</p>
                    <Button
                      size="sm"
                      onClick={() => { setViewTarget(null); openAssign(viewTarget); }}
                      className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign Customer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Customer Name</span>
                      <span className="font-medium flex items-center gap-1">{viewTarget.customerName}<CopyButton value={viewTarget.customerName} label="Customer Name" /></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Mobile Number</span>
                      <span className="font-medium flex items-center gap-1">{viewTarget.phone}<CopyButton value={viewTarget.phone} label="Mobile Number" /></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium flex items-center gap-1">{viewTarget.email || '—'}<CopyButton value={viewTarget.email} label="Email" /></span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-gray-600"
                      onClick={() => {
                        const block = `Name: ${viewTarget.customerName}\nMobile: ${viewTarget.phone}\nEmail: ${viewTarget.email || '—'}`;
                        navigator.clipboard.writeText(block);
                        toast.success('Customer details copied');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Customer Details
                    </Button>
                  </>
                )}
                <div className="flex justify-between items-center"><span className="text-gray-500">Rating</span><Stars n={viewTarget.rating} /></div>
                <div className="flex justify-between"><span className="text-gray-500">Selected Category</span><span className="font-medium">{viewTarget.category || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Review Date</span><span>{fmtDate(viewTarget.reviewDate || viewTarget.createdAt)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <Badge variant={(REQUEST_STATUS[viewTarget.status] ?? REQUEST_STATUS.pending).variant}>
                    {(REQUEST_STATUS[viewTarget.status] ?? REQUEST_STATUS.pending).label}
                  </Badge>
                </div>

                {alreadySent && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Scratch Card</p>
                    <div className="flex justify-between"><span className="text-gray-500">Reward Status</span><span className="font-medium capitalize">{viewTarget.rewardTransactionId.rewardStatus}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Revealed?</span><span className="font-medium">{viewTarget.rewardTransactionId.isScratched ? 'Yes' : 'Not yet'}</span></div>
                  </div>
                )}

                <div className="pt-2 border-t flex gap-2">
                  {viewTarget.status !== 'approved' && (
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => approveMut.mutate(viewTarget._id)}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {viewTarget.status !== 'rejected' && (
                    <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:text-red-700" onClick={() => rejectMut.mutate(viewTarget._id)}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
                {viewTarget.status === 'approved' && (
                  <Button className="w-full gap-2" onClick={() => sendMut.mutate(viewTarget._id)}>
                    <Gift className="h-4 w-4" /> {alreadySent ? 'Resend Scratch Card' : 'Send Scratch Card'}
                  </Button>
                )}
                {viewTarget.status === 'pending' && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    Approve this request before a Scratch Card can be sent.
                  </p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Assign Customer Details modal ───────────────────────── */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <UserPlus className="h-4.5 w-4.5 text-amber-600" />
              </span>
              Assign Customer Details
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-1">
            Fill in who left this review so you can send their Scratch Card over WhatsApp manually.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!assignForm.customerName.trim() || !assignForm.phone.trim()) {
                toast.error('Customer name and mobile number are required');
                return;
              }
              assignMut.mutate({ id: assignTarget._id, data: assignForm });
            }}
            className="space-y-4 pt-1"
          >
            <div className="space-y-1.5">
              <Label>Customer Name <span className="text-red-500">*</span></Label>
              <Input
                autoFocus
                value={assignForm.customerName}
                onChange={(e) => setAssignForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile Number <span className="text-red-500">*</span></Label>
              <Input
                value={assignForm.phone}
                onChange={(e) => setAssignForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                type="email"
                value={assignForm.email}
                onChange={(e) => setAssignForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="e.g. priya@email.com"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAssignTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={assignMut.isPending}>
                {assignMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
