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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Gift, Search, Plus, Loader2,
  Ticket, Send, Sparkles, Award, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Status configs ───────────────────────────────────────────────
   Lifecycle: Sent (link delivered, customer hasn't opened/scratched
   it yet) → Scratched (random reward revealed, countdown active) →
   Redeemed (client confirms in-store) or Expired (30 days passed). */
const REWARD_STATUS = {
  pending:   { label: 'Pending',   variant: 'outline' },
  sent:      { label: 'Sent',      variant: 'secondary' },
  scratched: { label: 'Scratched', variant: 'default' },
  redeemed:  { label: 'Redeemed',  variant: 'success' },
  expired:   { label: 'Expired',   variant: 'destructive' },
};

const TABS = [
  { key: '',               label: 'All Rewards' },
  { key: 'sent',           label: 'Sent — Awaiting Scratch' },
  { key: 'scratched',      label: 'Scratched' },
  { key: 'redeemed',       label: 'Redeemed' },
  { key: 'expired',        label: 'Expired' },
  { key: 'expiring_7',     label: 'Expiring in 7 Days' },
  { key: 'expiring_today', label: 'Expiring Today' },
];

/* ── Date helper ───────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Days-remaining pill ──────────────────────────────────────────
   Not meaningful until the customer actually scratches (no validUntil
   yet) — shows a plain dash for Sent rewards, "Expired" once
   terminal, "Today" on the last valid day, orange inside 3 days. */
function DaysRemaining({ reward }) {
  if (!reward.isScratched) return <span className="text-gray-400 text-sm">—</span>;
  if (reward.rewardStatus === 'expired') {
    return <span className="text-red-500 font-medium text-sm">Expired</span>;
  }
  const d = reward.daysRemaining ?? 0;
  if (d <= 0) return <span className="text-red-500 font-medium text-sm">Today</span>;
  return (
    <span className={cn('text-sm font-medium', d <= 3 ? 'text-orange-500' : 'text-gray-600')}>
      {d} {d === 1 ? 'Day' : 'Days'}
    </span>
  );
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

/* ── WhatsApp message builder ──────────────────────────────────────
   Exact spec template. GETMORE never sends this itself — clicking
   "Send WhatsApp" only opens wa.me with this text pre-filled; the
   owner still has to press Send inside WhatsApp manually. */
function buildWhatsAppMessage({ customerName, businessName, scratchCardUrl }) {
  return [
    `Hi ${customerName}`,
    `Thank you for reviewing ${businessName}.`,
    `Your Scratch Card reward is ready.`,
    `Click the secure link below.`,
    scratchCardUrl,
    `This Scratch Card can only be opened once.`,
    `Regards`,
    businessName,
  ].join('\n');
}

/* ═══════════════════════════════════════════════════════════════
   Reward Management — Create Scratch Card lives here. The business
   owner manually verifies the customer's Google Review in person
   (no digital trace), then clicks "Create Scratch Card" below and
   fills in the customer's details. That's the only way a reward
   transaction is ever created — nothing here is automatic. Sending
   the link over WhatsApp is also always a manual click. ═══════════ */
export default function RewardManagement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const businessName = user?.client?.businessName || 'Business';

  const [statusTab, setStatusTab] = useState('');
  const [search, setSearch]       = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage]           = useState(1);
  const [viewTarget, setViewTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', email: '', month: '' });
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['reward-transactions', statusTab, search, dateRange, page],
    queryFn: () => rewardsAPI.getAll({
      status: statusTab, search, dateRange, page, limit,
    }).then((r) => r.data),
  });

  const { data: campaignData } = useQuery({
    queryKey: ['reward-campaigns'],
    queryFn: () => rewardsAPI.getCampaigns().then((r) => r.data),
    enabled: createOpen,
  });
  const campaigns = campaignData?.data ?? [];
  // Default to the current campaign once loaded, but let the owner override.
  const selectedMonth = form.month || campaigns.find((c) => c.isCurrent)?.month || '';

  const invalidate = () => qc.invalidateQueries({ queryKey: ['reward-transactions'] });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => rewardsAPI.updateStatus(id, status),
    onSuccess: () => { toast.success('Reward status updated'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const sentMut = useMutation({
    mutationFn: (id) => rewardsAPI.markSent(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const createMut = useMutation({
    mutationFn: (payload) => rewardsAPI.create(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Scratch Card created');
      setCreateOpen(false);
      setForm({ customerName: '', phone: '', email: '', month: '' });
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create Scratch Card'),
  });

  function submitCreate(e) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim()) {
      toast.error('Customer name and mobile number are required');
      return;
    }
    createMut.mutate({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      month: selectedMonth || undefined,
    });
  }

  function sendWhatsApp(reward) {
    const phone = (reward.phone || '').replace(/\D/g, '');
    if (!phone) { toast.error('No phone number on file for this customer'); return; }
    const scratchCardUrl = `${window.location.origin}/reward/${reward.token}`;
    const message = buildWhatsAppMessage({
      customerName: reward.customerName,
      businessName,
      scratchCardUrl,
    });
    sentMut.mutate(reward._id);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  const rewards = data?.data ?? [];
  const counts  = data?.counts ?? {
    total: 0, sent: 0, scratched: 0, redeemed: 0, expired: 0, expiringSoon: 0, expiringToday: 0,
  };
  const pages   = data?.pages ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reward Management"
        subtitle="Create Scratch Card rewards after verifying a customer's Google Review in person"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Scratch Card
          </Button>
        }
      />

      {/* ── Scratch Card Analytics ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={Gift}     label="Total Rewards" value={counts.total}     color="text-gray-600"   bg="bg-gray-100" />
        <StatCard icon={Send}     label="Sent"          value={counts.sent}      color="text-blue-600"   bg="bg-blue-50" />
        <StatCard icon={Sparkles} label="Scratched"     value={counts.scratched} color="text-amber-600"  bg="bg-amber-50" />
        <StatCard icon={Award}    label="Redeemed"      value={counts.redeemed}  color="text-green-600"  bg="bg-green-50" />
        <StatCard icon={XCircle}  label="Expired"       value={counts.expired}   color="text-red-600"    bg="bg-red-50" />
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
          {TABS.map((t) => {
            const badgeCount = t.key === 'expiring_7' ? counts.expiringSoon
              : t.key === 'expiring_today' ? counts.expiringToday
                : null;
            return (
              <button
                key={t.key}
                onClick={() => { setStatusTab(t.key); setPage(1); }}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5',
                  statusTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {t.label}
                {!!badgeCount && (
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-semibold">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
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
              <p className="text-sm text-gray-300 mt-1">Click "Create Scratch Card" above after verifying a customer's review in person.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Reward Won</TableHead>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Won Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((r) => {
                    const rs = REWARD_STATUS[r.rewardStatus] ?? REWARD_STATUS.pending;
                    const canRedeem = r.rewardStatus === 'scratched';
                    return (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium text-gray-900">{r.customerName}</TableCell>
                        <TableCell className="text-gray-600">{r.phone}</TableCell>
                        <TableCell className="font-semibold text-amber-600">{r.isScratched ? `₹${r.rewardAmount}` : '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.couponCode || '—'}</TableCell>
                        <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.createdAt)}</TableCell>
                        <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.scratchedAt)}</TableCell>
                        <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.validUntil)}</TableCell>
                        <TableCell><DaysRemaining reward={r} /></TableCell>
                        <TableCell><Badge variant={rs.variant}>{rs.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline" size="sm" className="h-8 px-2.5 text-xs"
                              onClick={() => setViewTarget(r)}
                            >
                              👁 View Details
                            </Button>
                            {r.rewardStatus !== 'expired' && (
                              <Button
                                variant="outline" size="sm" className="h-8 px-2.5 text-xs"
                                disabled={sentMut.isPending}
                                onClick={() => sendWhatsApp(r)}
                              >
                                💬 Send WhatsApp
                              </Button>
                            )}
                            {canRedeem && (
                              <Button
                                variant="outline" size="sm" className="h-8 px-2.5 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                disabled={statusMut.isPending}
                                onClick={() => statusMut.mutate({ id: r._id, status: 'redeemed' })}
                              >
                                ✔ Mark as Redeemed
                              </Button>
                            )}
                          </div>
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
          {viewTarget && (() => {
            const isExpired = viewTarget.rewardStatus === 'expired';
            const canRedeem = viewTarget.rewardStatus === 'scratched';
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer Name</span><span className="font-medium">{viewTarget.customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Mobile Number</span><span className="font-medium">{viewTarget.phone}</span></div>
                {!!viewTarget.email && (
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{viewTarget.email}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Reward Won</span><span className="font-semibold text-amber-600">{viewTarget.isScratched ? `₹${viewTarget.rewardAmount}` : 'Not scratched yet'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Coupon Code</span><span className="font-mono">{viewTarget.couponCode || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sent Date</span><span>{fmtDate(viewTarget.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Won Date</span><span>{fmtDate(viewTarget.scratchedAt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Expiry Date</span><span>{fmtDate(viewTarget.validUntil)}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500">Days Remaining</span><DaysRemaining reward={viewTarget} /></div>

                <div className="pt-2 border-t">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">Reward Status</Label>
                  <Select
                    value={viewTarget.rewardStatus}
                    disabled={isExpired || !canRedeem}
                    onValueChange={(v) => {
                      statusMut.mutate({ id: viewTarget._id, status: v });
                      setViewTarget((t) => ({ ...t, rewardStatus: v }));
                    }}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(REWARD_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k} disabled={k !== viewTarget.rewardStatus && k !== 'redeemed'}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isExpired && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    This reward expired on {fmtDate(viewTarget.validUntil)} and can no longer be redeemed.
                  </p>
                )}
                {!isExpired && !viewTarget.isScratched && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    Waiting for the customer to open the link and scratch the card.
                  </p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Create Scratch Card dialog ──────────────────────────────
         Only entry point for a new reward transaction. Use this
         AFTER manually verifying the customer's Google Review in
         person — no automated check happens here. */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm({ customerName: '', phone: '', email: '', month: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scratch Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <Label>Customer Name</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. Priya Sharma"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Mobile Number</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Email <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                type="email"
                className="mt-1.5"
                placeholder="e.g. priya@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Select Reward Campaign</Label>
              <Select
                value={selectedMonth}
                onValueChange={(v) => setForm((f) => ({ ...f, month: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={campaigns.length ? 'Choose a campaign' : 'No active campaign — set up Scratch Card Rewards first'} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.month} value={c.month}>
                      {c.label}{c.isCurrent ? ' (Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || !campaigns.length} className="gap-1.5">
                {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Secure Scratch Card Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
