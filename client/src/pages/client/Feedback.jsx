import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Trash2, Inbox, CheckCircle2, Clock, Circle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Status config ─────────────────────────────────────────────── */
const STATUS = {
  new:         { label: 'New',         icon: Circle,       color: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', icon: Clock,        color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  resolved:    { label: 'Resolved',    icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500' },
  closed:      { label: 'Closed',      icon: XCircle,      color: 'bg-gray-100 text-gray-500 border-gray-200',    dot: 'bg-gray-400' },
};

const TABS = [
  { key: '',            label: 'All' },
  { key: 'new',         label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved' },
  { key: 'closed',      label: 'Closed' },
];

/* ── Star row ──────────────────────────────────────────────────── */
function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-3.5 w-3.5', i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200')} />
      ))}
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, color, bg }) {
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

/* ── Status badge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS[status] ?? STATUS.new;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border', cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function ClientFeedback() {
  const qc = useQueryClient();
  const [statusTab, setStatusTab] = useState('');

  /* ── Fetch all feedback (for summary counts) ──────────────────── */
  const { data: allData } = useQuery({
    queryKey: ['client-feedback-all'],
    queryFn: () => feedbackAPI.getAll({ limit: 200 }).then((r) => r.data),
    staleTime: 30_000,
  });

  /* ── Fetch filtered feedback ──────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['client-feedback', statusTab],
    queryFn: () => feedbackAPI.getAll({ status: statusTab, limit: 50 }).then((r) => r.data),
  });

  /* ── Mutations ────────────────────────────────────────────────── */
  const updateMut = useMutation({
    mutationFn: ({ id, status }) => feedbackAPI.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-feedback'] });
      qc.invalidateQueries({ queryKey: ['client-feedback-all'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => feedbackAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-feedback'] });
      qc.invalidateQueries({ queryKey: ['client-feedback-all'] });
      toast.success('Feedback deleted');
    },
  });

  /* ── Counts for summary cards ─────────────────────────────────── */
  const allItems = allData?.data ?? [];
  const counts = {
    new:         allItems.filter((f) => f.status === 'new').length,
    in_progress: allItems.filter((f) => f.status === 'in_progress').length,
    resolved:    allItems.filter((f) => f.status === 'resolved').length,
    total:       allItems.length,
  };

  const feedbacks = data?.data ?? [];

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      <PageHeader
        title="Feedback Tickets"
        subtitle="Private feedback from customers who rated 1–3 stars"
      />

      {/* ── Summary cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Inbox}        label="Total Feedback"  value={counts.total}       color="text-gray-600"   bg="bg-gray-100" />
        <SummaryCard icon={Circle}       label="New"             value={counts.new}          color="text-blue-600"   bg="bg-blue-50" />
        <SummaryCard icon={Clock}        label="In Progress"     value={counts.in_progress}  color="text-yellow-600" bg="bg-yellow-50" />
        <SummaryCard icon={CheckCircle2} label="Resolved"        value={counts.resolved}     color="text-green-600"  bg="bg-green-50" />
      </div>

      {/* ── Status filter tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map((t) => {
          const itemCount = t.key
            ? allItems.filter((f) => f.status === t.key).length
            : allItems.length;
          return (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all',
                statusTab === t.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
              {itemCount > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  statusTab === t.key ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500',
                )}>
                  {itemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Feedback list ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : feedbacks.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Inbox className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-400">No feedback tickets</p>
            <p className="text-sm text-gray-300 mt-1">
              {statusTab ? `No "${STATUS[statusTab]?.label}" tickets found.` : 'Feedback from 1–3 star reviews will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => {
            const cfg = STATUS[f.status] ?? STATUS.new;
            return (
              <Card key={f._id} className="border-0 shadow-sm hover:shadow transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Left: rating circle */}
                    <div className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0',
                      f.rating <= 1 ? 'bg-red-50 text-red-600'
                        : f.rating === 2 ? 'bg-red-50 text-red-500'
                        : 'bg-orange-50 text-orange-600',
                    )}>
                      {f.rating}★
                    </div>

                    {/* Middle: content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{f.customerName || 'Anonymous'}</span>
                        <StarRow rating={f.rating} />
                        <StatusBadge status={f.status} />
                        {f.categoryLabel && (
                          <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                            {f.categoryLabel}
                          </span>
                        )}
                      </div>

                      {(f.email || f.phone) && (
                        <p className="text-xs text-gray-400">
                          {f.phone && <span className="mr-3">📞 {f.phone}</span>}
                          {f.email && <span>✉ {f.email}</span>}
                        </p>
                      )}

                      {(f.message || f.feedback) && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
                          "{f.message || f.feedback}"
                        </p>
                      )}

                      <p className="text-[11px] text-gray-400">
                        {new Date(f.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Right: actions */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {/* Quick resolve — only show if not already resolved/closed */}
                      {!['resolved', 'closed'].includes(f.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300 gap-1"
                          onClick={() => updateMut.mutate({ id: f._id, status: 'resolved' })}
                          disabled={updateMut.isPending}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Resolve
                        </Button>
                      )}
                      {/* Status cycle dropdown */}
                      <div className="flex gap-1">
                        {f.status !== 'in_progress' && !['resolved', 'closed'].includes(f.status) && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-yellow-700 border-yellow-200 hover:bg-yellow-50 gap-1"
                            onClick={() => updateMut.mutate({ id: f._id, status: 'in_progress' })}
                            disabled={updateMut.isPending}
                          >
                            <Clock className="h-3 w-3" />
                            In Progress
                          </Button>
                        )}
                        {f.status === 'resolved' && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 gap-1"
                            onClick={() => updateMut.mutate({ id: f._id, status: 'closed' })}
                            disabled={updateMut.isPending}
                          >
                            <XCircle className="h-3 w-3" />
                            Close
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => toast(`Delete feedback from "${f.customerName}"?`, {
                            description: 'This cannot be undone.',
                            action: { label: 'Delete', onClick: () => deleteMut.mutate(f._id) },
                            cancel: { label: 'Cancel', onClick: () => {} },
                            duration: 8000,
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
