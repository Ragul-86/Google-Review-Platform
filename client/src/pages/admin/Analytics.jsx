import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, PieChartIcon, Star } from 'lucide-react';

/* ── Custom tooltip ─────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* ── Stat chip ───────────────────────────────────────────────── */
function StatChip({ label, value, color = 'gray' }) {
  const colors = {
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-600',
    blue:   'bg-blue-50 text-blue-700',
    amber:  'bg-amber-50 text-amber-700',
    gray:   'bg-gray-100 text-gray-600',
  };
  return (
    <div className={cn('px-3 py-1.5 rounded-lg text-sm', colors[color])}>
      <span className="font-bold">{value}</span>
      <span className="ml-1 text-[11px] font-medium">{label}</span>
    </div>
  );
}

/* ── Tab bar ─────────────────────────────────────────────────── */
const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'trends',   label: 'Trends',   icon: TrendingUp },
  { key: 'ratings',  label: 'Ratings',  icon: Star },
];

const PIE_COLORS = ['#22c55e', '#f97316'];

/* ════════════════════════════════════════════════════════════════ */
export default function AdminAnalytics() {
  const [tab, setTab] = useState('overview');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics-full'],
    queryFn: () => analyticsAPI.get().then((r) => r.data.data),
  });

  const monthly    = (analytics?.monthly ?? []).map((m) => ({
    month: m.month ?? m._id ?? '',
    reviews: m.count ?? 0,
  }));

  const distribution = (analytics?.distribution ?? []).map((d) => ({
    star: `${d.star ?? d._id}★`,
    count: d.count ?? 0,
  }));

  const pieData = [
    { name: 'Positive', value: analytics?.positive ?? 0 },
    { name: 'Feedback',  value: analytics?.negative ?? 0 },
  ];

  const positive  = analytics?.positive ?? 0;
  const negative  = analytics?.negative ?? 0;
  const total     = (positive + negative) || 1;

  return (
    <div className="space-y-5">
      {/* Page heading + CSAT badge */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Platform-wide trends and performance metrics</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSAT Score</p>
          {isLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{analytics?.csat ?? 0}%</p>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <StatChip label="Positive" value={positive} color="green" />
        <StatChip label="Feedback" value={negative} color="red" />
        <StatChip label="Avg Rating" value={analytics?.avgRating?.toFixed(1) ?? '—'} color="amber" />
        <StatChip label="Total" value={positive + negative} color="gray" />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Positive vs Feedback donut */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-900">Positive vs Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-52" /> : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        strokeWidth={2}
                      >
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {pieData.map((d, i) => (
                      <div key={d.name}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                          <span className="text-xs font-semibold text-gray-600">{d.name}</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 pl-4">{d.value}</p>
                        <p className="text-[11px] text-gray-400 pl-4">{Math.round((d.value / total) * 100)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-900">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-52" /> : distribution.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-gray-300">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distribution} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="star" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" name="Reviews" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Trends tab ───────────────────────────────────────────── */}
      {tab === 'trends' && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-900">Monthly Review Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64" /> : monthly.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-300">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="reviews" name="Reviews" stroke="#6366f1" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Ratings tab ──────────────────────────────────────────── */}
      {tab === 'ratings' && (
        <div className="space-y-4">
          {/* Distribution bars */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-900">Rating Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-56" /> : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const found = distribution.find((d) => d.star === `${star}★`);
                    const count = found?.count ?? 0;
                    const max   = Math.max(...distribution.map((d) => d.count), 1);
                    const pct   = Math.round((count / max) * 100);
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-6 text-right">{star}★</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-orange-400' : 'bg-red-400')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
