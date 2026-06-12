import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI, feedbackAPI, clientsAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star, Trash2, Search, ThumbsUp, ThumbsDown,
  MessageSquare, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Star row ────────────────────────────────────────────────── */
function Stars({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(sz, i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
      ))}
    </div>
  );
}

/* ── Rating badge ────────────────────────────────────────────── */
function RatingBadge({ rating }) {
  const green = rating >= 4;
  return (
    <div className={cn(
      'h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
      green ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600',
    )}>
      {rating}★
    </div>
  );
}

/* ── Chip filter ─────────────────────────────────────────────── */
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
        active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function AdminReviews() {
  const qc = useQueryClient();
  const [tab, setTab]             = useState('google');
  const [search, setSearch]       = useState('');
  const [ratingFilter, setRating] = useState('');
  const [clientFilter, setClient] = useState('');
  const [dateFilter, setDate]     = useState('');
  const [page, setPage]           = useState(1);
  const PER = 20;

  /* clients list for filter dropdown */
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data.data),
  });

  /* Google reviews query */
  const { data: googleData, isLoading: googleLoading } = useQuery({
    queryKey: ['admin-reviews', search, ratingFilter, clientFilter, dateFilter, page],
    queryFn: () => reviewsAPI.getAll({
      type: 'positive',
      search: search || undefined,
      rating: ratingFilter || undefined,
      clientId: clientFilter || undefined,
      dateRange: dateFilter || undefined,
      page, limit: PER,
    }).then((r) => r.data),
    enabled: tab === 'google',
  });

  /* Feedback query */
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['admin-feedback', search, ratingFilter, clientFilter, dateFilter, page],
    queryFn: () => feedbackAPI.getAll({
      search: search || undefined,
      rating: ratingFilter || undefined,
      clientId: clientFilter || undefined,
      dateRange: dateFilter || undefined,
      page, limit: PER,
    }).then((r) => r.data),
    enabled: tab === 'feedback',
  });

  const deleteReviewMut = useMutation({
    mutationFn: (id) => reviewsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const deleteFeedbackMut = useMutation({
    mutationFn: (id) => feedbackAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-feedback'] }); toast.success('Feedback deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  function resetFilters() {
    setSearch(''); setRating(''); setClient(''); setDate('');
    setPage(1);
  }

  function switchTab(t) { setTab(t); resetFilters(); }

  const googleReviews = googleData?.data ?? [];
  const feedbacks     = feedbackData?.data ?? [];
  const totalGoogle   = googleData?.total ?? 0;
  const totalFeedback = feedbackData?.total ?? 0;
  const totalPages    = Math.ceil((tab === 'google' ? totalGoogle : totalFeedback) / PER);
  const loading       = tab === 'google' ? googleLoading : feedbackLoading;
  const items         = tab === 'google' ? googleReviews : feedbacks;
  const hasFilters    = search || ratingFilter || clientFilter || dateFilter;

  const clients = clientsData ?? [];

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <p className="text-sm text-gray-400 mt-0.5">All reviews and feedback across the platform</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => switchTab('google')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'google' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <ThumbsUp className="h-4 w-4" />
          Google Reviews
          <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-full', tab === 'google' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500')}>
            {totalGoogle}
          </span>
        </button>
        <button
          onClick={() => switchTab('feedback')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'feedback' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <ThumbsDown className="h-4 w-4" />
          Private Feedback
          <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-full', tab === 'feedback' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500')}>
            {totalFeedback}
          </span>
        </button>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 h-10"
            placeholder={tab === 'google' ? 'Search reviews…' : 'Search feedback, customer…'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Rating filter */}
        <Select value={ratingFilter} onValueChange={(v) => { setRating(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-10 w-36">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {(tab === 'google' ? [5, 4] : [3, 2, 1]).map((r) => (
              <SelectItem key={r} value={String(r)}>{r}★</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Business filter */}
        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={(v) => { setClient(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="h-10 w-44">
              <SelectValue placeholder="All businesses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All businesses</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.businessName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range chips */}
        <div className="flex gap-1.5 flex-wrap">
          {[['', 'All'], ['today', 'Today'], ['week', 'Week'], ['month', 'Month']].map(([v, l]) => (
            <Chip key={v} active={dateFilter === v} onClick={() => { setDate(v); setPage(1); }}>{l}</Chip>
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
            Clear
          </button>
        )}
      </div>

      {/* ── List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {hasFilters ? 'No results for these filters' : `No ${tab === 'google' ? 'reviews' : 'feedback'} yet`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <Card key={item._id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RatingBadge rating={item.rating} />

                  <div className="flex-1 min-w-0">
                    {/* Business + date header */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {item.clientId?.businessName ?? '—'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          {item.clientId?.businessName && (
                            <span className="ml-2 text-gray-300">·</span>
                          )}
                          {tab === 'google'
                            ? (item.customerName ? <span className="ml-2 text-gray-500">{item.customerName}</span> : null)
                            : (item.customerName ? <span className="ml-2 text-gray-500">{item.customerName}</span> : null)
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Stars rating={item.rating} />
                        <button
                          onClick={() => {
                            const del = tab === 'google' ? deleteReviewMut : deleteFeedbackMut;
                            toast('Delete this entry?', {
                              description: 'This cannot be undone.',
                              action: { label: 'Delete', onClick: () => del.mutate(item._id) },
                              cancel: { label: 'Cancel', onClick: () => {} },
                              duration: 8000,
                            });
                          }}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-2 space-y-1">
                      {tab === 'google' ? (
                        <>
                          {item.categoryLabel && (
                            <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                              {item.categoryLabel}
                            </span>
                          )}
                          {(item.selectedSuggestion || item.reviewText) && (
                            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                              "{item.selectedSuggestion || item.reviewText}"
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.email && <span className="text-xs text-gray-500">{item.email}</span>}
                            {item.phone && <span className="text-xs text-gray-500">{item.phone}</span>}
                            {item.categoryLabel && (
                              <span className="text-[11px] font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                                {item.categoryLabel}
                              </span>
                            )}
                            <span className={cn(
                              'text-[11px] font-bold px-2 py-0.5 rounded-full capitalize',
                              item.status === 'resolved' || item.status === 'closed' ? 'bg-green-50 text-green-700' :
                              item.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-100 text-gray-500',
                            )}>
                              {(item.status || 'new').replace('_', ' ')}
                            </span>
                          </div>
                          {item.feedback && (
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.feedback}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500 px-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
