import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');

  const typeParam = tab === 'positive' ? 'positive' : tab === 'negative' ? 'negative' : '';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', tab],
    queryFn: () => reviewsAPI.getAll({ type: typeParam, limit: 50 }).then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => reviewsAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const reviews = data?.data ?? [];

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'positive', label: 'Positive (4–5★)' },
    { key: 'negative', label: 'Negative (1–3★)' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reviews</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 border rounded-lg p-1 w-fit bg-muted">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="space-y-2">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews.</p>}
          {reviews.map((r) => (
            <Card key={r._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.clientId?.businessName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.rating} />
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => { toast('Delete this review?', { description: 'This cannot be undone.', action: { label: 'Delete', onClick: () => deleteMut.mutate(r._id) }, cancel: { label: 'Cancel', onClick: () => {} }, duration: 8000 }); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {r.type === 'positive' ? (
                  <p className="text-sm text-muted-foreground mt-2">{r.categoryLabel ?? '—'}</p>
                ) : (
                  <div className="mt-2 text-sm space-y-0.5">
                    <p>
                      <strong>{r.customerName}</strong>
                      {r.customerEmail && <> · {r.customerEmail}</>}
                      {r.customerPhone && <> · {r.customerPhone}</>}
                    </p>
                    <p className="text-muted-foreground">{r.message || 'No comments'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
