import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => analyticsAPI.overview().then((r) => r.data.data),
  });

  const { data: analytics, isLoading: anLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsAPI.get().then((r) => r.data.data),
  });

  const loading = ovLoading || anLoading;

  const stats = [
    { label: 'Total Reviews', value: overview?.totalReviews ?? 0, icon: MessageSquare },
    { label: 'Total Clients', value: overview?.totalClients ?? 0, icon: ThumbsUp },
    { label: 'Active Clients', value: overview?.activeClients ?? 0, icon: ThumbsDown },
    { label: 'Average Rating', value: analytics?.avgRating?.toFixed(1) ?? '0.0', icon: Star },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Platform-wide review activity overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />)
        }
      </div>

      {/* Recent reviews */}
      <Card>
        <CardHeader><CardTitle>Recent reviews</CardTitle></CardHeader>
        <CardContent>
          {ovLoading ? (
            <Skeleton className="h-40" />
          ) : (overview?.recentReviews?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {(overview?.recentReviews ?? []).map((r) => (
                <div key={r._id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                  <div>
                    <span className="font-medium">{r.clientId?.businessName ?? '—'}</span>
                    <span className="ml-2 text-muted-foreground capitalize">{r.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating }).map((_, k) => (
                        <Star key={k} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatDateTime(r.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top clients */}
      {!ovLoading && (overview?.topClients?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle>Top clients by reviews</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(overview?.topClients ?? []).map((c, i) => (
                <div key={c._id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="font-medium">{c.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: Math.round(c.avgRating) }).map((_, k) => (
                        <Star key={k} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{c.count} reviews</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
