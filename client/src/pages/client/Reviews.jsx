import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewsAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const TABS = [
  { key: '', label: 'All' },
  { key: 'positive', label: 'Positive' },
  { key: 'negative', label: 'Negative' },
];

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

export default function ClientReviews() {
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['client-reviews', tab, page],
    queryFn: () => reviewsAPI.getAll({ type: tab, page, limit: 20 }).then((r) => r.data),
  });

  const reviews = data?.data ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">All customer reviews collected through your funnel</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border rounded-lg p-1 w-fit bg-muted">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              tab === t.key
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <Card key={r._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{r.customerName || 'Anonymous'}</p>
                    {r.type === 'positive' ? (
                      <p className="text-sm text-muted-foreground mt-1">{r.categoryLabel ?? '—'}</p>
                    ) : (
                      <>
                        {(r.customerEmail || r.customerPhone) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.customerEmail}{r.customerPhone && ` · ${r.customerPhone}`}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{r.message || '—'}</p>
                      </>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <StarRow rating={r.rating} />
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
