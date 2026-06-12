import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI, feedbackAPI, clientsAPI, categoriesAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star, Trash2, Search, ThumbsUp, ThumbsDown,
  MessageSquare, CheckCircle2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Stars ───────────────────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-3 w-3', i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
      ))}
    </div>
  );
}

/* ── Rating badge ────────────────────────────────────────────── */
function RatingBadge({ rating }) {
  return (
    <div className={cn(
      'h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
      rating >= 4 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600',
    )}>
      {rating}★
    </div>
  );
}

/* ── Filter chip ─────────────────────────────────────────────── */
function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
        active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50',
      )}
    >
      {label}
    </button>
  );
}

/* ── Status badge ────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    new:         'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-50 text-blue-700',
    resolved:    'bg-green-50 text-green-700',
    closed:      'bg-teal-50 text-teal-700',
  };
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', map[status] ?? map.new)}>
      {(status || 'new').replace('_', ' ')}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function AdminReviews() {
  const qc = useQueryClient();
  const [tab, setTab]           = useState('all');  // all | google | feedback | resolved | pending
  const [search, setSearch]     = useState('');
  const [ratingFilter, setRating] = useState('');
  const [clientFilter, setClient] = useState('');
  const [dateFilter, setDate]   = useState('');
  const [categoryFilter, setCat]= useState('');
  const [page, setPage]         = useState(1);
  const PER = 20;

  /* ── Support data ────────────────────────────────────────────── */
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data.data ?? r.data),
  });

  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.data ?? []);

  /* ── Google reviews query ────────────────────────────────────── */
  const showGoogle   = ['all', 'google'].includes(tab);
  const showFeedback = ['all', 'feedback', 'resolved', 'pending'].includes(tab);

  const { data: googleData, isLoading: googleLoading } = useQuery({
    queryKey: ['admin-rev-google', search, ratingFilter, clientFilter, dateFilter, page],
    queryFn: () => reviewsAPI.getAll({
      type: 'positive',
      search: search || undefined,
      rating: ratingFilter || undefined,
      clientId: clientFilter || undefined,
      dateRange: dateFilter || undefined,
      page, limit: PER,
    }).then((r) => r.data),
    enabled: showGoogle,
  });

  /* ── Feedback query ──────────────────────────────────────────── */
  const statusParam = tab === 'resolved' ? undefined : tab === 'pending' ? undefined : undefined;
  // We filter resolved/pending client-side from full result
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['admin-rev-feedback', search, ratingFilter, clientFilter, dateFilter, tab, page],
    queryFn: () => feedbackAPI.getAll({
      search: search || undefined,
      rating: ratingFilter || undefined,
      clientId: clientFilter || undefined,
      dateRange: dateFilter || undefined,
      status: tab === 'resolved' ? undefined : tab === 'pending' ? undefined : undefined,
      page, limit: tab === 'all' ? PER : PER,
    }).then((r) => r.data),
    enabled: showFeedback,
  });

  /* ── Mutations ───────────────────────────────────────────────── */
  const deleteReviewMut = useMutation({
    mutationFn: (id) => reviewsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rev-google'] }); toast.success('Review deleted'); },
  });

  const deleteFeedbackMut = useMutation({
    mutationFn: (id) => feedbackAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rev-feedback'] }); toast.success('Feedback deleted'); },
  });

  function resetFilters() {
    setSearch(''); setRating(''); setClient(''); setDate(''); setCat(''); setPage(1);
  }

  function switchTab(t) { setTab(t); resetFilters(); }

  /* Derive lists based on tab */
  const googleReviews = (googleData?.data ?? []).filter((r) => {
    if (categoryFilter) return (r.categoryLabel || '').toLowerCase().includes(categoryFilter.toLowerCase());
    return true;
  });

  let feedbacks = feedbackData?.data ?? [];
  if (tab === 'resolved') feedbacks = feedbacks.filter((f) => ['resolved','closed'].includes(f.status));
  if (tab === 'pending')  feedbacks = feedbacks.filter((f) => ['new','in_progress'].includes(f.status));
  if (categoryFilter) feedbacks = feedbacks.filter((f) => (f.categoryLabel || '').toLowerCase().includes(categoryFilter.toLowerCase()));

  const totalGoogle   = googleData?.total ?? 0;
  const totalFeedback = feedbackData?.total ?? 0;

  const loading = (showGoogle && googleLoading) || (showFeedback && feedbackLoading);
  const hasFilters = search || ratingFilter || clientFilter || dateFilter || categoryFilter;

  /* ── Tab counts ──────────────────────────────────────────────── */
  const tabs = [
    { key: 'all',      label: 'All',       icon: MessageSquare, count: totalGoogle + totalFeedback },
    { key: 'google',   label: 'Google',    icon: ThumbsUp,      count: totalGoogle,   color: 'green' },
    { key: 'feedback', label: 'Feedback',  icon: ThumbsDown,    count: totalFeedback, color: 'orange' },
    { key: 'resolved', label: 'Resolved',  icon: CheckCircle2,  count: null, color: 'teal' },
    { key: 'pending',  label: 'Pending',   icon: Clock,         count: null, color: 'amber' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <p className="text-sm text-gray-400 mt-0.5">All reviews and feedback across the platform</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {tabs.map(({ key, label, icon: Icon, count, color }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count !== null && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                tab === key
                  ? color === 'green'  ? 'bg-green-100 text-green-700'  :
                    color === 'orange' ? 'bg-orange-100 text-orange-700' :
                    color === 'teal'   ? 'bg-teal-100 text-teal-700' :
                    'bg-gray-100 text-gray-600'
                  : 'bg-gray-200 text-gray-500',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 h-10"
            placeholder="Search name, content…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Business filter */}
        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={(v) => { setClient(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="h-10 w-44">
              <SelectValue placeholder="All businesses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All businesses</SelectItem>
              {clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.businessName}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* Rating */}
        <Select value={ratingFilter} onValueChange={(v) => { setRating(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-10 w-36">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5,4,3,2,1].map((r) => <SelectItem key={r} value={String(r)}>{r}★</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Category search */}
        <Input
          className="h-10 w-40"
          placeholder="Category filter…"
          value={categoryFilter}
          onChange={(e) => { setCat(e.target.value); setPage(1); }}
        />

        {/* Date chips */}
        <div className="flex gap-1.5">
          {[['','All'],['today','Today'],['week','Week'],['month','Month']].map(([v,l]) => (
            <Chip key={v} label={l} active={dateFilter === v} onClick={() => { setDate(v); setPage(1); }} />
          ))}
        </div>

        {hasFilters && (
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
            Clear
          </button>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Google reviews */}
          {showGoogle && googleReviews.map((r) => (
            <Card key={`rev-${r._id}`} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RatingBadge rating={r.rating} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{r.clientId?.businessName ?? '—'}</p>
                        <p className="text-xs text-gray-400">
                          {r.customerName && <span className="mr-1">{r.customerName} ·</span>}
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Stars rating={r.rating} />
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Google</span>
                        <button
                          onClick={() => toast('Delete review?', {
                            description: 'Cannot be undone.',
                            action: { label: 'Delete', onClick: () => deleteReviewMut.mutate(r._id) },
                            cancel: { label: 'Cancel', onClick: () => {} },
                            duration: 8000,
                          })}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {r.categoryLabel && (
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                          {r.categoryLabel}
                        </span>
                      )}
                      {(r.selectedSuggestion || r.reviewText) && (
                        <p className="text-sm text-gray-500 italic">"{r.selectedSuggestion || r.reviewText}"</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Feedback */}
          {showFeedback && feedbacks.map((f) => (
            <Card key={`fb-${f._id}`} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RatingBadge rating={f.rating} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{f.clientId?.businessName ?? '—'}</p>
                        <p className="text-xs text-gray-400">
                          {f.customerName && <span className="mr-1">{f.customerName} ·</span>}
                          {new Date(f.createdAt).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Stars rating={f.rating} />
                        <StatusBadge status={f.status} />
                        <button
                          onClick={() => toast('Delete feedback?', {
                            description: 'Cannot be undone.',
                            action: { label: 'Delete', onClick: () => deleteFeedbackMut.mutate(f._id) },
                            cancel: { label: 'Cancel', onClick: () => {} },
                            duration: 8000,
                          })}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {f.email && <span className="text-xs text-gray-400">{f.email}</span>}
                        {f.phone && <span className="text-xs text-gray-400">{f.phone}</span>}
                        {f.categoryLabel && (
                          <span className="text-[11px] font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                            {f.categoryLabel}
                          </span>
                        )}
                      </div>
                      {f.feedback && <p className="text-sm text-gray-600 leading-relaxed">{f.feedback}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty state */}
          {!loading && googleReviews.length === 0 && feedbacks.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {hasFilters ? 'No results for these filters' : 'No reviews yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {(() => {
        const total = showGoogle ? totalGoogle : totalFeedback;
        const pages = Math.ceil(total / PER);
        if (pages <= 1) return null;
        return (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-gray-500 px-2">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        );
      })()}
    </div>
  );
}
