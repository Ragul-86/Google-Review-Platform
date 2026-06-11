import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, customersAPI, reviewsAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Star, Users, MessageCircle, MessageSquare, BarChart3,
} from 'lucide-react';

/* ── Tab pill ─────────────────────────────────────────────────── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all',
            active === t
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ── Section card ─────────────────────────────────────────────── */
function ChartCard({ title, sub, children, loading, minH = 'h-56' }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4">
          <p className="text-[14px] font-bold text-gray-900">{title}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {loading ? <Skeleton className={minH} /> : children}
      </CardContent>
    </Card>
  );
}

/* ── Funnel step ──────────────────────────────────────────────── */
function FunnelStep({ label, count, pct, color, isLast }) {
  return (
    <div className="relative">
      <div className={cn('rounded-xl p-3.5 text-white', color)} style={{ width: `${Math.max(pct, 12)}%`, minWidth: 120 }}>
        <p className="text-[11px] font-semibold opacity-80 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold leading-none mt-1">{count}</p>
        <p className="text-[11px] opacity-70 mt-0.5">{pct}% of total</p>
      </div>
      {!isLast && (
        <div className="ml-4 mt-1 mb-1 h-4 w-px bg-gray-200" />
      )}
    </div>
  );
}

/* ── Custom tooltip ───────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════ */
const TABS = ['Overview', 'Reviews', 'Customer Journey', 'Services'];

export default function ClientAnalytics() {
  const [tab, setTab] = useState('Overview');

  /* ── Data fetches ────────────────────────────────────────────── */
  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ['client-analytics-full'],
    queryFn: () => analyticsAPI.get().then((r) => r.data.data),
  });

  const { data: custData, isLoading: cLoading } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => customersAPI.getAnalytics().then((r) => r.data.data),
  });

  const { data: statsData, isLoading: sLoading } = useQuery({
    queryKey: ['review-stats'],
    queryFn: () => reviewsAPI.stats().then((r) => r.data.data),
    staleTime: 30_000,
  });

  const c = custData ?? {};
  const s = statsData ?? {};

  /* ── Derived chart data ─────────────────────────────────────── */
  const ratingDistData = [
    { star: '5★', count: s.googleByRating?.[5] ?? 0, fill: '#facc15' },
    { star: '4★', count: s.googleByRating?.[4] ?? 0, fill: '#fde047' },
    { star: '3★', count: s.feedbackByRating?.[3] ?? 0, fill: '#fb923c' },
    { star: '2★', count: s.feedbackByRating?.[2] ?? 0, fill: '#f87171' },
    { star: '1★', count: s.feedbackByRating?.[1] ?? 0, fill: '#ef4444' },
  ];

  const funnelData = [
    { label: 'Added',    count: c.totalCustomers  ?? 0, color: 'bg-indigo-500'  },
    { label: 'WA Sent',  count: c.whatsappSent    ?? 0, color: 'bg-green-500'   },
    { label: 'Opened',   count: c.opened          ?? 0, color: 'bg-blue-500'    },
    { label: 'Reviews',  count: c.googleReviews   ?? 0, color: 'bg-yellow-500'  },
    { label: 'Feedback', count: c.privateFeedback ?? 0, color: 'bg-orange-500'  },
  ];
  const funnelTotal = c.totalCustomers || 1;

  const serviceChartData = (c.byService ?? []).slice(0, 8).map((row) => ({
    name:    row.service?.length > 14 ? row.service.slice(0, 14) + '…' : row.service,
    reviews: row.googleReviews,
    feedback: row.feedback,
    customers: row.total,
  }));

  const pieData = [
    { name: 'Google Reviews', value: s.googleReviews  ?? 0 },
    { name: 'Feedback',       value: s.privateFeedback ?? 0 },
  ];
  const PIE_COLORS = ['#facc15', '#fb923c'];

  /* ── Summary KPIs ────────────────────────────────────────────── */
  const kpis = [
    { icon: Users,         label: 'Total Customers',  value: c.totalCustomers  ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: Star,          label: 'Google Reviews',   value: s.googleReviews   ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: MessageSquare, label: 'Private Feedback', value: s.privateFeedback ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: TrendingUp,    label: 'Conversion Rate',  value: `${c.conversionRate ?? 0}%`, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Performance metrics, rating trends, and conversion insights" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', k.bg)}>
                <k.icon className={cn('h-5 w-5', k.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      {tab === 'Overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Response Breakdown" sub="Google reviews vs private feedback" loading={sLoading}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}
                  label={({ name, value }) => value > 0 ? `${value}` : ''}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Review Trend" sub="Total reviews submitted each month" loading={aLoading}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="count" name="Reviews" stroke="hsl(var(--primary))" strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── REVIEWS ──────────────────────────────────────────────── */}
      {tab === 'Reviews' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Rating Distribution" sub="All ratings from 1★ to 5★" loading={sLoading}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingDistData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="star" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                  {ratingDistData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Star Breakdown" sub="Share of each star rating" loading={sLoading}>
            <div className="space-y-3 pt-1">
              {[
                { star: 5, count: s.googleByRating?.[5]  ?? 0, total: s.googleReviews  ?? 0, color: 'bg-yellow-400' },
                { star: 4, count: s.googleByRating?.[4]  ?? 0, total: s.googleReviews  ?? 0, color: 'bg-yellow-300' },
                { star: 3, count: s.feedbackByRating?.[3] ?? 0, total: s.privateFeedback ?? 0, color: 'bg-orange-300' },
                { star: 2, count: s.feedbackByRating?.[2] ?? 0, total: s.privateFeedback ?? 0, color: 'bg-red-400' },
                { star: 1, count: s.feedbackByRating?.[1] ?? 0, total: s.privateFeedback ?? 0, color: 'bg-red-500' },
              ].map(({ star, count, total, color }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 w-5">{star}★</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ── CUSTOMER JOURNEY ─────────────────────────────────────── */}
      {tab === 'Customer Journey' && (
        <div className="space-y-4">
          <ChartCard title="Conversion Funnel" sub="Customer journey from outreach to review submission" loading={cLoading}>
            <div className="space-y-1 pt-1">
              {funnelData.map((step, i) => (
                <FunnelStep
                  key={step.label}
                  label={step.label}
                  count={step.count}
                  pct={Math.round((step.count / funnelTotal) * 100)}
                  color={step.color}
                  isLast={i === funnelData.length - 1}
                />
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Stage-to-Stage Conversion" sub="What % of each prior stage moved to the next" loading={cLoading}>
            <div className="space-y-3 pt-1">
              {[
                { from: 'Customers Added',  to: 'WA Sent',     a: c.totalCustomers ?? 0, b: c.whatsappSent    ?? 0 },
                { from: 'WA Sent',          to: 'Link Opened',  a: c.whatsappSent   ?? 0, b: c.opened          ?? 0 },
                { from: 'Link Opened',      to: 'Submitted',    a: c.opened         ?? 0, b: (c.googleReviews  ?? 0) + (c.privateFeedback ?? 0) },
                { from: 'Submitted',        to: 'Google Review', a: (c.googleReviews ?? 0) + (c.privateFeedback ?? 0), b: c.googleReviews ?? 0 },
              ].map(({ from, to, a, b }) => {
                const rate = a > 0 ? Math.round((b / a) * 100) : 0;
                return (
                  <div key={from} className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600 font-medium">{from} → {to}</span>
                        <span className="font-bold text-gray-900 tabular-nums">{rate}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            rate >= 50 ? 'bg-green-400' : rate >= 25 ? 'bg-yellow-400' : 'bg-red-300',
                          )}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right tabular-nums">{b} / {a}</span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ── SERVICES ─────────────────────────────────────────────── */}
      {tab === 'Services' && (
        <div className="space-y-4">
          {serviceChartData.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No service data yet</p>
                <p className="text-xs text-gray-300 mt-1">Add customers with services to see performance breakdown.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <ChartCard title="Reviews by Service" sub="Google reviews and feedback per service" loading={cLoading}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={serviceChartData} barCategoryGap="30%" barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={9} />
                    <Bar dataKey="reviews"  name="Google Reviews"   fill="#facc15" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="feedback" name="Private Feedback" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Service Performance Table" sub="Full breakdown by service" loading={cLoading}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Service', 'Customers', 'WA Sent', 'Reviews', 'Feedback', 'Conversion'].map((h) => (
                          <th key={h} className="pb-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider pr-4 last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(c.byService ?? []).map((row) => (
                        <tr key={row.service} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 pr-4 font-semibold text-gray-900 max-w-[140px] truncate">{row.service}</td>
                          <td className="py-2.5 pr-4 text-gray-600 tabular-nums">{row.total}</td>
                          <td className="py-2.5 pr-4 text-gray-600 tabular-nums">{row.waSent}</td>
                          <td className="py-2.5 pr-4 text-green-700 font-semibold tabular-nums">{row.googleReviews}</td>
                          <td className="py-2.5 pr-4 text-orange-700 font-semibold tabular-nums">{row.feedback}</td>
                          <td className="py-2.5">
                            <span className={cn(
                              'font-bold tabular-nums',
                              row.conversionRate >= 50 ? 'text-green-600' : row.conversionRate >= 25 ? 'text-yellow-600' : 'text-gray-400',
                            )}>
                              {row.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}
