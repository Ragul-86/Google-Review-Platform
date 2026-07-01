import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardConfigAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Gift, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, RotateCcw, Ticket, Layers, Save,
  CalendarClock, CheckCircle2, History, Lock, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Month helpers ──────────────────────────────────────────── */
function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatMonthLabel(m) {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY = { amount: '', totalCards: '' };
const EMPTY_BULK = { start: '', end: '', step: '' };

/* ── TierForm (outside parent to prevent remount on render) ──── */
function TierForm({ values, onFieldChange, onSubmit, loading, submitLabel }) {
  return (
    <div className="space-y-3 mt-2">
      <div>
        <Label>Reward Amount (₹) *</Label>
        <Input
          type="number"
          min="0"
          value={values.amount}
          onChange={(e) => onFieldChange('amount', e.target.value)}
          placeholder="e.g. 10, 20, 50, 100"
        />
      </div>
      <div>
        <Label>Total Cards *</Label>
        <Input
          type="number"
          min="1"
          value={values.totalCards}
          onChange={(e) => onFieldChange('totalCards', e.target.value)}
          placeholder="e.g. 100"
        />
        <p className="text-xs text-muted-foreground mt-1">
          How many customers can win this reward this month.
        </p>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : submitLabel}
      </Button>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function ScratchCardSettings() {
  const qc = useQueryClient();

  const [month, setMonth]           = useState(currentMonthStr());
  const [addOpen, setAddOpen]       = useState(false);
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [editForm, setEditForm]     = useState(EMPTY);
  const [bulkForm, setBulkForm]     = useState(EMPTY_BULK);
  // Generate Tiers — two-step: 'form' (range inputs) → 'preview' (editable tier rows)
  const [bulkStep, setBulkStep]           = useState('form');
  const [generatedTiers, setGeneratedTiers] = useState([]); // [{ amount, totalCards }]
  // Per-tier card-count edits, keyed by tier _id — pending until "Save All"
  const [counts, setCounts]         = useState({});

  const handleAddField  = useCallback((k, v) => setForm((p)     => ({ ...p, [k]: v })), []);
  const handleEditField = useCallback((k, v) => setEditForm((p) => ({ ...p, [k]: v })), []);
  const handleBulkField = useCallback((k, v) => setBulkForm((p) => ({ ...p, [k]: v })), []);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['reward-configs'] });
    qc.invalidateQueries({ queryKey: ['reward-config-months'] });
    qc.invalidateQueries({ queryKey: ['reward-config-history'] });
    qc.invalidateQueries({ queryKey: ['reward-cycle-status'] });
  }, [qc]);

  /* ── Queries ──────────────────────────────────────────────── */
  const { data: monthsData } = useQuery({
    queryKey: ['reward-config-months'],
    queryFn: () => rewardConfigAPI.getMonths().then((r) => r.data.data),
  });

  // Automatic Monthly Reset status — Current Reward Month, Next Automatic
  // Reset date, and confirmation that the cron-driven rollover is enabled.
  const { data: cycle } = useQuery({
    queryKey: ['reward-cycle-status'],
    queryFn: () => rewardConfigAPI.getCycleStatus().then((r) => r.data.data),
  });

  // Every month this client has reward history for — powers the
  // "Previous Month History" table below the live tier editor.
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['reward-config-history'],
    queryFn: () => rewardConfigAPI.getHistory().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reward-configs', month],
    queryFn: () => rewardConfigAPI.getAll({ month }).then((r) => r.data),
  });

  const tiers = data?.data ?? [];
  // Server is the authoritative source for whether this month can be
  // edited — falls back to a client-side current-month check only while
  // the request is still in flight, so controls never briefly flash
  // "editable" for a month that the server will reject.
  const editable = data ? !!data.editable : month === currentMonthStr();
  const isPast   = data ? !!data.isPast   : month < currentMonthStr();

  const monthOptions = useMemo(() => {
    const set = new Set([currentMonthStr(), ...(monthsData ?? [])]);
    return Array.from(set).sort().reverse();
  }, [monthsData]);
  const previousMonthOptions = useMemo(
    () => monthOptions.filter((m) => m !== currentMonthStr()),
    [monthOptions],
  );

  /* ── Mutations ──────────────────────────────────────────────── */
  const createMut = useMutation({
    mutationFn: rewardConfigAPI.create,
    onSuccess: () => { toast.success('Reward tier added'); setAddOpen(false); setForm(EMPTY); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to add tier'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data: d }) => rewardConfigAPI.update(id, d),
    onSuccess: () => { toast.success('Reward tier updated'); setEditTarget(null); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update tier'),
  });

  const deleteMut = useMutation({
    mutationFn: rewardConfigAPI.delete,
    onSuccess: () => { toast.success('Reward tier deleted'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to delete tier'),
  });

  const toggleMut = useMutation({
    mutationFn: rewardConfigAPI.toggle,
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update tier'),
  });

  const resetMut = useMutation({
    mutationFn: () => rewardConfigAPI.reset({ month }),
    onSuccess: () => { toast.success(`Rewards reset for ${formatMonthLabel(month)}`); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to reset'),
  });

  // ── Bulk save: persist each generated tier (amount + totalCards) individually.
  // Uses Promise.allSettled so a duplicate rejection doesn't abort the rest.
  const bulkSaveMut = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        generatedTiers.map((t) =>
          rewardConfigAPI.create({ amount: t.amount, totalCards: Number(t.totalCards) || 0, month }),
        ),
      );
      const created = results.filter((r) => r.status === 'fulfilled').length;
      const skipped = results.filter((r) => r.status === 'rejected').length;
      return { created, skipped };
    },
    onSuccess: ({ created, skipped }) => {
      toast.success(
        skipped > 0
          ? `Saved ${created} tier${created === 1 ? '' : 's'} (${skipped} already existed or failed)`
          : `Saved ${created} reward tier${created === 1 ? '' : 's'}`,
      );
      setBulkOpen(false);
      setBulkForm(EMPTY_BULK);
      setGeneratedTiers([]);
      setBulkStep('form');
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to save tiers'),
  });

  // ── Save All: bulk-persist every pending per-tier card-count edit at once
  const dirtyEntries = useMemo(
    () => (!editable ? [] : Object.entries(counts).filter(([id, v]) => {
      const t = tiers.find((x) => x._id === id);
      return t && v !== '' && Number.isFinite(Number(v)) && Number(v) !== Number(t.totalCards);
    })),
    [counts, tiers, editable],
  );

  const saveAllMut = useMutation({
    mutationFn: async () => {
      await Promise.all(dirtyEntries.map(([id, v]) => rewardConfigAPI.update(id, { totalCards: Number(v) })));
      return dirtyEntries.length;
    },
    onSuccess: (n) => {
      toast.success(`Saved ${n} tier${n === 1 ? '' : 's'}`);
      setCounts({});
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to save changes'),
  });

  function openEdit(tier) {
    setEditTarget(tier);
    setEditForm({ amount: String(tier.amount), totalCards: String(tier.totalCards) });
  }

  function confirmReset() {
    toast(`Reset Monthly Rewards — ${formatMonthLabel(month)}?`, {
      description: "This action will reset only the current month's reward statistics. Previous month history will remain unchanged.",
      action: { label: 'Reset', onClick: () => resetMut.mutate() },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 10000,
    });
  }

  /* ── Totals across tiers for this month ──────────────────────── */
  const totals = tiers.reduce(
    (acc, t) => ({
      cards: acc.cards + t.totalCards,
      claimed: acc.claimed + t.claimed,
      remaining: acc.remaining + t.remaining,
      distributed: acc.distributed + t.distributed,
    }),
    { cards: 0, claimed: 0, remaining: 0, distributed: 0 },
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Scratch Card Settings"
        subtitle="Configure reward tiers customers can win after submitting a Google review"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Current Month</SelectLabel>
                  <SelectItem value={currentMonthStr()}>{formatMonthLabel(currentMonthStr())}</SelectItem>
                </SelectGroup>
                {previousMonthOptions.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Previous Months</SelectLabel>
                    {previousMonthOptions.map((m) => (
                      <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={confirmReset}
              disabled={resetMut.isPending || !editable}
              title={editable ? undefined : 'Only the current month can be reset'}
            >
              <RotateCcw className="h-4 w-4" /> Reset Monthly Rewards
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setBulkOpen(true)}
              disabled={!editable}
              title={editable ? undefined : 'Only the current month is editable'}
            >
              <Layers className="h-4 w-4" /> Generate Tiers
            </Button>
            <Button
              className="gap-2"
              onClick={() => setAddOpen(true)}
              disabled={!editable}
              title={editable ? undefined : 'Only the current month is editable'}
            >
              <Plus className="h-4 w-4" /> Add Tier
            </Button>
          </div>
        }
      />

      {/* ── Automatic Monthly Reset status panel ───────────────── */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Gift className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Current Reward Month</p>
                <p className="font-semibold text-gray-900">{cycle?.currentMonthLabel ?? formatMonthLabel(currentMonthStr())}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarClock className="h-4.5 w-4.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Next Automatic Reset</p>
                <p className="font-semibold text-gray-900">
                  {cycle?.nextResetDate ? fmtDate(cycle.nextResetDate) : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Automatic Reset Status</p>
                <Badge variant="success" className="mt-0.5">Automatic Monthly Reset Enabled</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPast && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
          <Lock className="h-4 w-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">
            {formatMonthLabel(month)} is a past reward cycle and is read-only. Only {formatMonthLabel(currentMonthStr())} can be edited.
          </p>
        </div>
      )}

      {dirtyEntries.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-sm text-amber-700">
            {dirtyEntries.length} tier{dirtyEntries.length === 1 ? '' : 's'} with unsaved card-count changes
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCounts({})} disabled={saveAllMut.isPending}>
              Discard
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => saveAllMut.mutate()} disabled={saveAllMut.isPending}>
              {saveAllMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All
            </Button>
          </div>
        </div>
      )}

      {/* ── Reward Analytics summary ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Cards',      value: totals.cards,      color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Claimed',          value: totals.claimed,    color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Remaining',        value: totals.remaining,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Total Distributed', value: `₹${totals.distributed}`, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className={cn('p-4 rounded-xl', s.bg)}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tier list ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : tiers.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <Gift className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No reward tiers for {formatMonthLabel(month)}</p>
            <p className="text-sm text-gray-400">Add tiers like ₹10 → 100 cards, ₹50 → 20 cards.</p>
            {editable && (
              <Button size="sm" className="mt-1 gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Add your first tier
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tiers.map((tier) => (
            <Card key={tier._id} className={cn('transition-all duration-200', tier.status === 'inactive' && 'opacity-60')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    title={!editable ? 'Read only' : tier.status === 'active' ? 'Disable tier' : 'Enable tier'}
                    onClick={() => editable && toggleMut.mutate(tier._id)}
                    disabled={!editable}
                    className={cn('shrink-0 transition-colors', !editable && 'cursor-not-allowed opacity-60')}
                  >
                    {tier.status === 'active' ? (
                      <ToggleRight className="h-7 w-7 text-green-500 hover:text-green-600" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 min-w-[90px]">
                    <Ticket className="h-5 w-5 text-amber-500" />
                    <span className="font-bold text-lg text-gray-900">₹{tier.amount}</span>
                  </div>

                  <div className="shrink-0 w-[110px]">
                    <Label className="text-[11px] text-gray-400">Total Cards</Label>
                    <Input
                      type="number"
                      min="0"
                      disabled={!editable}
                      className={cn('h-8 mt-0.5', counts[tier._id] !== undefined && Number(counts[tier._id]) !== tier.totalCards && 'border-amber-400 ring-1 ring-amber-200')}
                      value={counts[tier._id] ?? tier.totalCards}
                      onChange={(e) => setCounts((p) => ({ ...p, [tier._id]: e.target.value }))}
                    />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{tier.claimed} / {tier.totalCards} claimed</span>
                      <span>{tier.remaining} remaining</span>
                    </div>
                    <Progress value={tier.progress} />
                  </div>

                  <div className="text-xs text-gray-500 min-w-[110px] text-right">
                    Distributed<br /><span className="font-semibold text-gray-700">₹{tier.distributed}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      title={editable ? 'Edit tier' : 'Read only'}
                      onClick={() => editable && openEdit(tier)}
                      disabled={!editable}
                      className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                        editable ? 'bg-gray-50 hover:bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-300 cursor-not-allowed',
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title={editable ? 'Delete tier' : 'Read only'}
                      disabled={!editable}
                      onClick={() => {
                        if (!editable) return;
                        toast(`Delete the ₹${tier.amount} tier?`, {
                          description: 'This cannot be undone.',
                          action: { label: 'Delete', onClick: () => deleteMut.mutate(tier._id) },
                          cancel: { label: 'Cancel', onClick: () => {} },
                          duration: 8000,
                        });
                      }}
                      className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                        editable ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-gray-50 text-gray-300 cursor-not-allowed',
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Previous Month History ──────────────────────────────
           Read-only, permanent record of every month's totals — never
           deleted or rewritten by the monthly rollover or manual reset. */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4.5 w-4.5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Previous Month History</h3>
          </div>
          {historyLoading ? (
            <Skeleton className="h-32" />
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No reward history yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead>Total Cards</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Distributed</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Expired</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow
                    key={h.month}
                    className={cn('cursor-pointer', h.month === month && 'bg-amber-50/60')}
                    onClick={() => setMonth(h.month)}
                  >
                    <TableCell className="font-medium text-gray-900">{h.monthLabel}</TableCell>
                    <TableCell>{h.tierCount}</TableCell>
                    <TableCell>{h.totalCards}</TableCell>
                    <TableCell>{h.claimed}</TableCell>
                    <TableCell>{h.remaining}</TableCell>
                    <TableCell>₹{h.distributed}</TableCell>
                    <TableCell>{h.opened}</TableCell>
                    <TableCell>{h.pending}</TableCell>
                    <TableCell>{h.expired}</TableCell>
                    <TableCell>
                      {h.isCurrent ? (
                        <Badge variant="success">Current</Badge>
                      ) : (
                        <Badge variant="secondary">Read Only</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Add dialog ──────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Reward Tier — {formatMonthLabel(month)}</DialogTitle></DialogHeader>
          <TierForm
            values={form}
            onFieldChange={handleAddField}
            onSubmit={() => {
              if (!form.amount || !form.totalCards) return toast.error('Amount and total cards are required');
              createMut.mutate({ amount: form.amount, totalCards: form.totalCards, month });
            }}
            loading={createMut.isPending}
            submitLabel="Add Tier"
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ─────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Reward Tier</DialogTitle></DialogHeader>
          {editTarget && (
            <TierForm
              values={editForm}
              onFieldChange={handleEditField}
              onSubmit={() => {
                if (!editForm.amount || !editForm.totalCards) return toast.error('Amount and total cards are required');
                updateMut.mutate({ id: editTarget._id, data: { amount: editForm.amount, totalCards: editForm.totalCards } });
              }}
              loading={updateMut.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Generate Tiers dialog ─────────────────────────────────────────────
           Two-step flow:
           Step 1 — "form"    : Enter Start / End / Step, click Generate Tiers
           Step 2 — "preview" : Editable table of reward amounts + Total Cards
                                per row, then Save Reward Tiers persists all.
        ─────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={bulkOpen}
        onOpenChange={(o) => {
          setBulkOpen(o);
          if (!o) { setBulkForm(EMPTY_BULK); setGeneratedTiers([]); setBulkStep('form'); }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkStep === 'preview' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBulkStep('form')}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                    title="Back to range inputs"
                  >
                    <ArrowLeft className="h-4 w-4 text-gray-500" />
                  </button>
                  Generate Reward Tiers — {formatMonthLabel(month)}
                </div>
              ) : (
                `Generate Reward Tiers — ${formatMonthLabel(month)}`
              )}
            </DialogTitle>
          </DialogHeader>

          {bulkStep === 'form' ? (
            /* ── Step 1: Range inputs ─────────────────────────────── */
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Start (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bulkForm.start}
                    onChange={(e) => handleBulkField('start', e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">End (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bulkForm.end}
                    onChange={(e) => handleBulkField('end', e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Step (₹)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bulkForm.step}
                    onChange={(e) => handleBulkField('step', e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Live preview hint */}
              {(() => {
                const s = Number(bulkForm.start);
                const e = Number(bulkForm.end);
                const st = Number(bulkForm.step);
                if (!bulkForm.start || !bulkForm.end || !bulkForm.step) return null;
                if (!Number.isFinite(s) || !Number.isFinite(e) || !Number.isFinite(st) || st <= 0 || e < s) return null;
                const count = Math.floor((e - s) / st) + 1;
                const preview = [];
                for (let a = s; a <= e + 0.0001 && preview.length < 4; a += st) preview.push(Math.round(a));
                return (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
                    <p className="text-xs text-amber-700 font-medium mb-0.5">{count} tiers will be generated</p>
                    <p className="text-xs text-amber-600">
                      ₹{preview.join(', ₹')}{count > 4 ? `, … ₹${Math.round(e)}` : ''}
                    </p>
                  </div>
                );
              })()}

              <p className="text-xs text-gray-400">
                You'll set the card count for each reward amount on the next step.
              </p>

              <Button
                className="w-full gap-2"
                onClick={() => {
                  const s  = Number(bulkForm.start);
                  const e  = Number(bulkForm.end);
                  const st = Number(bulkForm.step);
                  if (!Number.isFinite(s) || !Number.isFinite(e) || !Number.isFinite(st) || st <= 0 || e < s || s < 0) {
                    return toast.error('Enter a valid Start, End and Step (Step > 0, End ≥ Start ≥ 0)');
                  }
                  const amounts = [];
                  for (let a = s; a <= e + 0.0001; a += st) amounts.push(Math.round(a));
                  setGeneratedTiers(amounts.map((a) => ({ amount: a, totalCards: '' })));
                  setBulkStep('preview');
                }}
              >
                <Layers className="h-4 w-4" /> Generate Tiers
              </Button>
            </div>
          ) : (
            /* ── Step 2: Editable tier table ─────────────────────── */
            <div className="space-y-4 mt-2">

              {/* Summary badge */}
              <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-amber-700">
                  {generatedTiers.length} reward tier{generatedTiers.length === 1 ? '' : 's'} generated
                </p>
                <span className="text-xs text-amber-500">Enter card counts below</span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_130px] gap-3 px-1 pb-2 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Reward Amount</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Cards</p>
              </div>

              {/* Scrollable tier rows */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                {generatedTiers.map((tier, idx) => (
                  <div
                    key={tier.amount}
                    className="grid grid-cols-[1fr_130px] gap-3 items-center rounded-lg px-1 py-1 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                        <Ticket className="h-3.5 w-3.5 text-amber-500" />
                      </span>
                      <span className="font-semibold text-gray-900 text-sm">₹{tier.amount}</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={tier.totalCards}
                      onChange={(e) =>
                        setGeneratedTiers((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, totalCards: e.target.value } : t)),
                        )
                      }
                      className="h-8 text-center font-medium"
                    />
                  </div>
                ))}
              </div>

              {/* Auto-set note */}
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                Remaining Cards = Total Cards &nbsp;·&nbsp; Claimed = 0 &nbsp;·&nbsp; Distributed = ₹0
                <br />These are set automatically on save.
              </p>

              {/* Save button */}
              <Button
                className="w-full gap-2"
                disabled={bulkSaveMut.isPending}
                onClick={() => {
                  const invalid = generatedTiers.some(
                    (t) => t.totalCards === '' || isNaN(Number(t.totalCards)) || Number(t.totalCards) < 0,
                  );
                  if (invalid) return toast.error('Enter a valid card count (≥ 0) for every reward tier');
                  bulkSaveMut.mutate();
                }}
              >
                {bulkSaveMut.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  <><Save className="h-4 w-4" />Save Reward Tiers</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
