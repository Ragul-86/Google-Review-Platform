import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI, feedbackAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Star, MessageSquare, ThumbsUp, BarChart3,
  ChevronLeft, ChevronRight, Inbox,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Star row ─────────────────────────────────────────────────── */
function StarRow({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200',
          )}
        />
      ))}
    </div>
  );
}

/* ─── Stat card ────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 leading-none mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Rating distribution bar ──────────────────────────────────── */
function RatingBar({ stars, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex items-center gap-0.5 w-6 shrink-0 text-xs font-medium text-gray-600">
        {stars}<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
    </div>
  );
}

/* ─── Status badge + selector ──────────────────────────────────── */
const STATUS_CONFIG = {
  new:         { label: 'New',         color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  resolved:    { label: 'Resolved',    color: 'bg-green-50 text-green-700 border-green-200' },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function StatusBadge({ status, feedbackId, onUpdate }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const statuses = Object.entries(STATUS_CONFIG);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'px-2 py-0.5 rounded-full border text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-80',
          cfg.color,
        )}
      >
        {cfg.label} ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[130px]">
            {statuses.map(([key, c]) => (
              <button
                key={key}
                onClick={() => { onUpdate(feedbackId, key); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors',
                  key === status && 'opacity-50 pointer-events-none',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
      <Icon className="h-10 w-10 text-gray-200" />
      <p className="font-medium text-gray-500">{title}</p>
      <p className="text-sm text-gray-400">{sub}</p>
    </div>
  );
}

/* ─── Pagination ───────────────────────────────────────────────── */
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-gray-400">Page {page} of {pages}</p>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1}
          onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= pages}
          onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function ClientReviews() {
  const qc = useQueryClient();
  const [tab, setTab]           = useState('google');   // 'google' | 'feedback'
  const [ratingFilter, setRF]   = useState(0);          // 0 = all
  const [googlePage, setGP]     = useState(1);
  const [feedbackPage, setFP]   = useState(1);

  /* ── Stats ─────────────────────────────────────────────────── */
  const { data: statsData } = useQuery({
    queryKey: ['review-stats'],
    queryFn: () => reviewsAPI.stats().then((r) => r.data.data),
    staleTime: 30_000,
  });
  const stats = statsData ?? {};

  /* ── Google Reviews ─────────────────────────────────────────── */
  const { data: gData, isLoading: gLoading } = useQuery({
    queryKey: ['client-google-reviews', ratingFilter, googlePage],
    queryFn: () => reviewsAPI.getAll({
      type: 'positive',
      rating: ratingFilter || undefined,
      page: googlePage,
      limit: 15,
    }).then((r) => r.data),
    enabled: tab === 'google',
  });

  /* ── Private Feedback ───────────────────────────────────────── */
  const { data: fData, isLoading: fLoading } = useQuery({
    queryKey: ['client-feedback', ratingFilter, feedbackPage],
    queryFn: () => feedbackAPI.getAll({
      rating: ratingFilter || undefined,
      page: feedbackPage,
      limit: 15,
    }).then((r) => r.data),
    enabled: tab === 'feedback',
  });

  /* ── Status update mutation ─────────────────────────────────── */
  const statusMut = useMutation({
    mutationFn: ({ id, status }) => feedbackAPI.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-feedback'] });
      qc.invalidateQueries({ queryKey: ['review-stats'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  /* ── Helpers ────────────────────────────────────────────────── */
  function switchTab(t) {
    setTab(t);
    setRF(0);
  }

  const googleReviews = gData?.data ?? [];
  const googlePages   = gData?.pages ?? 1;
  const feedbacks     = fData?.data ?? [];
  const fbPages       = fData?.pages ?? 1;

  const googleFilters  = [0, 5, 4];
  const feedbackFilters = [0, 1, 2, 3];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      <PageHeader title="Reviews" subtitle="Monitor Google reviews and private customer feedback" />

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={ThumbsUp}     label="Google Reviews"   value={stats.googleReviews  ?? 0} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard icon={MessageSquare} label="Private Feedback" value={stats.privateFeedback ?? 0} color="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={BarChart3}     label="Total Responses"  value={stats.total           ?? 0} color="text-blue-600"   bg="bg-blue-50" />
      </div>

      {/* ── Rating distribution ───────────────────────────────── */}
      {(stats.total ?? 0) > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {/* Google */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-3">Google Review Ratings</p>
              <RatingBar stars={5} count={stats.googleByRating?.[5] ?? 0} total={stats.googleReviews ?? 0} color="bg-yellow-400" />
              <RatingBar stars={4} count={stats.googleByRating?.[4] ?? 0} total={stats.googleReviews ?? 0} color="bg-yellow-300" />
            </CardContent>
          </Card>
          {/* Feedback */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-3">Feedback Ratings</p>
              <RatingBar stars={3} count={stats.feedbackByRating?.[3] ?? 0} total={stats.privateFeedback ?? 0} color="bg-orange-300" />
              <RatingBar stars={2} count={stats.feedbackByRating?.[2] ?? 0} total={stats.privateFeedback ?? 0} color="bg-red-400" />
              <RatingBar stars={1} count={stats.feedbackByRating?.[1] ?? 0} total={stats.privateFeedback ?? 0} color="bg-red-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab switcher ──────────────────────────────────────── */}
      <div className="flex gap-1 border rounded-xl p-1 w-fit bg-gray-50">
        {[
          { key: 'google',   label: 'Google Reviews',   count: stats.googleReviews  ?? 0, icon: ThumbsUp },
          { key: 'feedback', label: 'Private Feedback',  count: stats.privateFeedback ?? 0, icon: MessageSquare },
        ].map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={cn(
              'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
              tab === key ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500',
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Rating filter chips ───────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Filter:</span>
        {(tab === 'google' ? googleFilters : feedbackFilters).map((r) => (
          <button
            key={r}
            onClick={() => { setRF(r); tab === 'google' ? setGP(1) : setFP(1); }}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all',
              ratingFilter === r
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
            )}
          >
            {r === 0 ? 'All ratings' : (
              <><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {r}★</>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* GOOGLE REVIEWS TAB                                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'google' && (
        <div className="space-y-3">
          {gLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : googleReviews.length === 0 ? (
            <EmptyState
              icon={ThumbsUp}
              title="No Google reviews yet"
              sub="When customers submit 4★–5★ reviews through your funnel they'll appear here."
            />
          ) : (
            googleReviews.map((r) => (
              <Card key={r._id} className="border-0 shadow-sm hover:shadow transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Name + category */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">
                          {r.customerName || 'Anonymous'}
                        </p>
                        {r.categoryLabel && (
                          <span className="text-[11px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                            {r.categoryLabel}
                          </span>
                        )}
                        {r.source === 'qr' && (
                          <span className="text-[11px] bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-medium">QR</span>
                        )}
                      </div>
                      {/* Review text */}
                      {(r.selectedSuggestion || r.reviewText) && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                          "{r.selectedSuggestion || r.reviewText}"
                        </p>
                      )}
                    </div>
                    {/* Rating + date */}
                    <div className="shrink-0 text-right space-y-1.5">
                      <StarRow rating={r.rating} />
                      <p className="text-[11px] text-gray-400">{formatDateTime(r.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Pagination page={googlePage} pages={googlePages} onPage={setGP} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* PRIVATE FEEDBACK TAB                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {/* Status breakdown */}
          {(stats.feedbackByStatus) && (stats.privateFeedback ?? 0) > 0 && (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const n = stats.feedbackByStatus?.[key] ?? 0;
                if (!n) return null;
                return (
                  <span key={key} className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border', cfg.color)}>
                    {cfg.label}: {n}
                  </span>
                );
              })}
            </div>
          )}

          {fLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : feedbacks.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No private feedback yet"
              sub="When customers submit 1★–3★ ratings through your funnel they'll appear here."
            />
          ) : (
            feedbacks.map((fb) => (
              <Card key={fb._id} className="border-0 shadow-sm hover:shadow transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Name + service badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">
                          {fb.customerName || 'Anonymous'}
                        </p>
                        {fb.categoryLabel && (
                          <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
                            {fb.categoryLabel}
                          </span>
                        )}
                      </div>
                      {/* Contact info */}
                      {(fb.email || fb.phone) && (
                        <p className="text-xs text-gray-400">
                          {fb.phone && <span className="mr-2">📞 {fb.phone}</span>}
                          {fb.email && <span>✉ {fb.email}</span>}
                        </p>
                      )}
                      {/* Message */}
                      {fb.feedback && (
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          "{fb.feedback}"
                        </p>
                      )}
                    </div>
                    {/* Rating + date + status */}
                    <div className="shrink-0 text-right space-y-2">
                      <StarRow rating={fb.rating} />
                      <p className="text-[11px] text-gray-400">{formatDateTime(fb.createdAt)}</p>
                      <StatusBadge
                        status={fb.status}
                        feedbackId={fb._id}
                        onUpdate={(id, status) => statusMut.mutate({ id, status })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Pagination page={feedbackPage} pages={fbPages} onPage={setFP} />
        </div>
      )}
    </div>
  );
}
