import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#ef4444', '#22c55e'];

const TABS = ['Reviews', 'Ratings', 'Funnel'];

export default function ClientAnalytics() {
  const [tab, setTab] = useState('Reviews');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['client-analytics-full'],
    queryFn: () => analyticsAPI.get().then((r) => r.data.data),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance, ratings, and funnel conversion</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border rounded-lg p-1 w-fit bg-muted">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Reviews tab */}
      {tab === 'Reviews' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Positive vs Negative</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Negative', value: analytics?.negative ?? 0 },
                        { name: 'Positive', value: analytics?.positive ?? 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
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

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Monthly trend</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics?.monthly ?? []}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ratings tab */}
      {tab === 'Ratings' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
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

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Star Breakdown</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-56" /> : (
                <div className="space-y-2 pt-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const entry = analytics?.distribution?.find((d) => d.star === star);
                    const count = entry?.count || 0;
                    const total = analytics?.total || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-sm w-10 text-muted-foreground">{star} ★</span>
                        <Progress value={pct} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funnel tab */}
      {tab === 'Funnel' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Funnel Overview</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-48" /> : (
                <div className="space-y-3 pt-2">
                  {[
                    { label: 'Total Visits', value: analytics?.total ?? 0 },
                    { label: 'Positive Reviews', value: analytics?.positive ?? 0 },
                    { label: 'Negative Feedback', value: analytics?.negative ?? 0 },
                    { label: 'CSAT Score', value: `${analytics?.csat ?? 0}%` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {(analytics?.qrCodes?.length || 0) > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">QR Code Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.qrCodes.map((q) => (
                    <div key={q._id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                      <span>{q.title}</span>
                      <span className="font-medium">{q.scanCount} scans</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
