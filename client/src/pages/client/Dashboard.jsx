import { useQuery } from '@tanstack/react-query';
import { reviewsAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ClientDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['client-overview'],
    queryFn: () => reviewsAPI.overview().then((r) => r.data.data),
  });

  const stats = [
    { label: 'Total Reviews', value: data?.total ?? 0, icon: MessageSquare },
    { label: 'Positive', value: data?.positive ?? 0, icon: ThumbsUp },
    { label: 'Negative', value: data?.negative ?? 0, icon: ThumbsDown },
    { label: 'Avg Rating', value: data?.average?.toFixed(1) ?? '0.0', icon: Star },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your business review overview" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />)
        }
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Welcome</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Use the sidebar to manage your reviews, QR codes, categories, and analytics.</p>
          <p>Start by configuring your <strong className="text-foreground">Google Review URL</strong> in Settings, then generate a QR code to share with customers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
