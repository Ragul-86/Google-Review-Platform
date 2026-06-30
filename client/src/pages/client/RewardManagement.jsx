import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsAPI } from '@/api';
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
  Gift, Search, MoreVertical, Eye, MessageCircle, CheckCircle2,
  Ticket, Clock, Send, Award, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Status configs ───────────────────────────────────────────── */
const REWARD_STATUS = {
  pending:  { label: 'Pending',  variant: 'warning' },
  sent:     { label: 'Sent',     variant: 'default' },
  redeemed: { label: 'Redeemed', variant: 'success' },
  expired:  { label: 'Expired',  variant: 'destructive' },
};
const WA_STATUS = {
  not_sent: { label: 'Not Sent', variant: 'outline' },
  opened:   { label: 'Opened',   variant: 'secondary' },
  sent:     { label: 'Sent',     variant: 'success' },
};

const TABS = [
  { key: '',         label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'sent',     label: 'Sent' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'expired',  label: 'Expired' },
];

/* ── Build the pre-filled WhatsApp message.
   GETMORE never sends this automatically — it only opens WhatsApp Web /
   the WhatsApp app with the message pre-filled. The client must press
   Send themselves inside WhatsApp. ───────────────────────────────── */
function buildRewardMessage(reward, businessName) {
  const validLine = reward.validUntil
    ? `\nValid until: ${new Date(reward.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : '';
  return `Hi ${reward.customerName}! 🎉\n\nThank you for your review! You've won a reward of *₹${reward.rewardAmount}*.\n\nYour coupon code: *${reward.couponCode}*${validLine}\n\nShow this code at our store to redeem your reward.\n\nThank you,\n*${businessName || 'Our Team'}*`;
}

/* ── Stat card ─────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════ */
export default function RewardManagement() {
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
    queryKey: ['reward-transactions', statusTab, search, dateRange, page],
    queryFn: () => rewardsAPI.getAll({
      status: statusTab, search, dateRange, page, limit,
    }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['reward-transactions'] });

  const markOpenedMut = useMutation({
    mutationFn: rewardsAPI.markWhatsappOpened,
    onSuccess: invalidate,
  });

  const markSentMut = useMutation({
    mutationFn: rewardsAPI.markSent,
    onSuccess: () => { toast.success('Marked as sent'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => rewardsAPI.updateStatus(id, status),
    onSuccess: () => { toast.success('Reward status updated'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  /* Open WhatsApp Web with a pre-filled message — the client still has to
     press Send themselves. We just record that the compose screen opened. */
  function handleSendWhatsApp(reward) {
    const phone = (reward.phone || '').replace(/\D/g, '');
    if (!phone) { toast.error('No phone number on file for this customer'); return; }
    const msg = buildRewardMessage(reward, businessName);
    markOpenedMut.mutate(reward._id);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  const rewards = data?.data ?? [];
  const counts  = data?.counts ?? { total: 0, pending: 0, sent: 0, redeemed: 0, expired: 0 };
  const pages   = data?.pages ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reward Management"
        subtitle="Track scratch-card rewards won by customers and manage WhatsApp delivery"
      />

      {/* ── Scratch Card Analytics ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={Gift}        label="Total Rewards"    value={counts.total}    color="text-gray-600"   bg="bg-gray-100" />
        <StatCard icon={Clock}       label="Pending"          value={counts.pending}  color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard icon={Send}        label="Sent"              value={counts.sent}     color="text-blue-600"   bg="bg-blue-50" />
        <StatCard icon={Award}       label="Redeemed"         value={counts.redeemed} color="text-green-600"  bg="bg-green-50" />
        <StatCard icon={XCircle}     label="Expired"          value={counts.expired}  color="text-red-600"    bg="bg-red-50" />
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
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
              placeholder="Name, phone, amount…"
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

      {/* ── Table ────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : rewards.length === 0 ? (
            <div className="py-16 text-center">
              <Ticket className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-400">No rewards found</p>
              <p className="text-sm text-gray-300 mt-1">Rewards won via the scratch card will show up here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Reward Won</TableHead>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Reward Status</TableHead>
                  <TableHead>WhatsApp Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((r) => {
                  const rs = REWARD_STATUS[r.rewardStatus] ?? REWARD_STATUS.pending;
                  const ws = WA_STATUS[r.whatsappStatus] ?? WA_STATUS.not_sent;
                  return (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium text-gray-900">{r.customerName}</TableCell>
                      <TableCell className="text-gray-600">{r.phone}</TableCell>
                      <TableCell className="font-semibold text-amber-600">₹{r.rewardAmount}</TableCell>
                      <TableCell className="font-mono text-xs">{r.couponCode}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(r.reviewDate || r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell><Badge variant={rs.variant}>{rs.label}</Badge></TableCell>
                      <TableCell><Badge variant={ws.variant}>{ws.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewTarget(r)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendWhatsApp(r)}>
                              <MessageCircle className="h-4 w-4 mr-2" /> Send WhatsApp
                            </DropdownMenuItem>
                            {r.whatsappStatus !== 'sent' && (
                              <DropdownMenuItem onClick={() => markSentMut.mutate(r._id)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Sent
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
          )}
        </CardContent>
      </Card>

      {/* ── Pagination ───────────────────────────────────────────── */}
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
          <DialogHeader><DialogTitle>Reward Details</DialogTitle></DialogHeader>
          {viewTarget && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer Name</span><span className="font-medium">{viewTarget.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Mobile Number</span><span className="font-medium">{viewTarget.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reward Won</span><span className="font-semibold text-amber-600">₹{viewTarget.rewardAmount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Coupon Code</span><span className="font-mono">{viewTarget.couponCode}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Review Date</span><span>{new Date(viewTarget.reviewDate || viewTarget.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              {viewTarget.validUntil && (
                <div className="flex justify-between"><span className="text-gray-500">Valid Until</span><span>{new Date(viewTarget.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">WhatsApp Status</span>
                <Badge variant={(WA_STATUS[viewTarget.whatsappStatus] ?? WA_STATUS.not_sent).variant}>
                  {(WA_STATUS[viewTarget.whatsappStatus] ?? WA_STATUS.not_sent).label}
                </Badge>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-gray-500 text-xs uppercase tracking-wide">Reward Status</Label>
                <Select
                  value={viewTarget.rewardStatus}
                  onValueChange={(v) => {
                    statusMut.mutate({ id: viewTarget._id, status: v });
                    setViewTarget((t) => ({ ...t, rewardStatus: v }));
                  }}
                >
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REWARD_STATUS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full gap-2 mt-2" onClick={() => handleSendWhatsApp(viewTarget)}>
                <MessageCircle className="h-4 w-4" /> Send WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
