import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#ef4444', '#22c55e'];

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics-full'],
    queryFn: () => analyticsAPI.get().then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Customer Satisfaction Score</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-3xl font-bold">{analytics?.csat ?? 0}%</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Positive vs Negative */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Positive vs Negative</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Negative', value: analytics?.negative ?? 0 },
                      { name: 'Positive', value: analytics?.positive ?? 0 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label={({ value }) => value > 0 ? value : ''}
                  >
                    {[0, 1].map((i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Rating distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Rating distribution</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics?.distribution ?? []}>
                  <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#facc15" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly reviews */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Monthly reviews</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-60" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={analytics?.monthly ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Reviews" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
