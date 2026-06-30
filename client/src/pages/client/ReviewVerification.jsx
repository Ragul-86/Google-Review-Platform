import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewRequestsAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['review-requests', statusTab, search, dateRange, page],
    queryFn: () => reviewRequestsAPI.getAll({
      status: statusTab, search, dateRange, page, limit,
    }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['review-requests'] });

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
                        <TableCell className="font-medium text-gray-900">{r.customerName}</TableCell>
                        <TableCell className="text-gray-600">{r.phone}</TableCell>
                        <TableCell className="text-gray-600">{r.email || '—'}</TableCell>
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
                <div className="flex justify-between"><span className="text-gray-500">Customer Name</span><span className="font-medium">{viewTarget.customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Mobile Number</span><span className="font-medium">{viewTarget.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{viewTarget.email || '—'}</span></div>
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
    </div>
  );
}
