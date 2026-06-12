import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, MessageSquare, ThumbsUp, ThumbsDown,
  QrCode, Star, TrendingUp, BarChart3,
  Activity, Users, CheckCircle2, AlertCircle, Gauge,
  Heart, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

/* ── Onboarding status badge ─────────────────────────────────── */
const ONBOARDING = {
  draft:             { label: 'Draft',             cls: 'bg-yellow-50 text-yellow-700' },
  awaiting_approval: { label: 'Awaiting',          cls: 'bg-orange-50 text-orange-700' },
  changes_requested: { label: 'Changes Req.',      cls: 'bg-red-50 text-red-700' },
  live:              { label: 'Live',              cls: 'bg-green-50 text-green-700' },
  inactive:          { label: 'Inactive',          cls: 'bg-gray-100 text-gray-500' },
};
function OBadge({ status }) {
  const cfg = ONBOARDING[status] ?? ONBOARDING.draft;
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', cfg.cls)}>{cfg.label}</span>;
}
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color = 'gray', loading }) {
  const palettes = {
    blue:   { ring: 'bg-blue-100',   icon: 'text-blue-600' },
    green:  { ring: 'bg-green-100',  icon: 'text-green-600' },
    amber:  { ring: 'bg-amber-100',  icon: 'text-amber-600' },
    purple: { ring: 'bg-purple-100', icon: 'text-purple-600' },
    rose:   { ring: 'bg-rose-100',   icon: 'text-rose-600' },
    orange: { ring: 'bg-orange-100', icon: 'text-orange-600' },
    teal:   { ring: 'bg-teal-100',   icon: 'text-teal-600' },
    gray:   { ring: 'bg-gray-100',   icon: 'text-gray-600' },
  };
  const p = palettes[color] ?? palettes.gray;
  if (loading) return <Skeleton className="h-28 rounded-2xl" />;
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1.5 leading-none">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl shrink-0', p.ring)}>
            <Icon className={cn('h-5 w-5', p.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Custom chart tooltip ────────────────────────────────────── */
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

/* ── Activity item ───────────────────────────────────────────── */
function ActivityItem({ item }) {
  const isGoogle   = item.__activityType === 'google_review';
  const isFeedback = item.__activityType === 'private_feedback';

  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      {/* Icon badge */}
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold',
        isGoogle   ? 'bg-green-50 text-green-700'  :
        isFeedback ? 'bg-orange-50 text-orange-600' :
                     'bg-gray-100 text-gray-500',
      )}>
        {isGoogle ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate">
          {item.clientId?.businessName ?? '—'}
        </p>
        <p className="text-[11px] text-gray-400">
          {item.customerName && <span className="mr-1">{item.customerName} ·</span>}
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </p>
      </div>

      {/* Tag */}
      <div className="flex items-center gap-2 shrink-0">
        {item.rating && (
          <span className="text-[11px] font-semibold text-amber-600">
            {item.rating}★
          </span>
        )}
        <span className={cn(
          'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
          isGoogle
            ? 'bg-green-50 text-green-700'
            : item.status === 'resolved' || item.status === 'closed'
              ? 'bg-teal-50 text-teal-700'
              : 'bg-orange-50 text-orange-600',
        )}>
          {isGoogle ? 'Google' : (item.status || 'new').replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
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

  const monthly = (analytics?.monthly ?? []).map((m) => ({
    month: m.month ?? '',
    reviews: m.count ?? 0,
  }));

  const clientGrowth = (analytics?.clientGrowth ?? []).map((m) => ({
    month: m.month ?? '',
    clients: m.count ?? 0,
  }));

  const ov = overview ?? {};

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">Real-time metrics across all client accounts</p>
      </div>

      {/* ── 8 KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard loading={loading} icon={Building2}    color="blue"   label="Total Clients"      value={ov.totalClients   ?? 0} sub={`${ov.activeClients ?? 0} active`} />
        <KpiCard loading={loading} icon={ThumbsUp}     color="green"  label="Google Reviews"     value={ov.totalReviews   ?? 0} sub="Positive submissions" />
        <KpiCard loading={loading} icon={ThumbsDown}   color="rose"   label="Private Feedback"   value={ov.totalFeedback  ?? 0} sub={`${ov.openTickets ?? 0} open`} />
        <KpiCard loading={loading} icon={CheckCircle2} color="teal"   label="Resolved Tickets"   value={ov.resolvedTickets ?? 0} sub={`${ov.openTickets ?? 0} pending`} />
        <KpiCard loading={loading} icon={AlertCircle}  color="orange" label="Open Tickets"       value={ov.openTickets   ?? 0} sub="Needs attention" />
        <KpiCard loading={loading} icon={Star}         color="amber"  label="Avg Rating"         value={analytics?.avgRating?.toFixed(1) ?? '—'} sub="Across all reviews" />
        <KpiCard loading={loading} icon={Gauge}        color="purple" label="Platform Score"     value={`${ov.platformScore ?? 0}%`} sub="Satisfaction score" />
        <KpiCard loading={loading} icon={QrCode}       color="gray"   label="QR Codes"           value={ov.totalQRCodes   ?? analytics?.qrCodes?.length ?? 0} sub="Across platform" />
      </div>

      {/* ── Charts row ───────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-sm font-bold text-gray-900">Monthly Reviews</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-48" /> : monthly.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-300">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="reviews" name="Reviews" stroke="#6366f1" strokeWidth={2} fill="url(#reviewGrad)" dot={{ r: 3, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-sm font-bold text-gray-900">Client Growth</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-48" /> : clientGrowth.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-300">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={clientGrowth} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="clients" name="New Clients" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity feed + top clients ──────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Combined activity feed */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-sm font-bold text-gray-900">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {ovLoading ? <Skeleton className="h-52" /> :
              (ov.recentActivity?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-300">No activity yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(ov.recentActivity ?? []).map((item) => (
                    <ActivityItem key={`${item.__activityType}-${item._id}`} item={item} />
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-sm font-bold text-gray-900">Top Clients</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {ovLoading ? <Skeleton className="h-52" /> :
              (ov.topClients?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-300">No clients yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(ov.topClients ?? []).map((c, i) => (
                    <div key={c._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                        i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500',
                      )}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{c.businessName}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: Math.round(c.avgRating ?? 0) }).map((_, k) => (
                            <Star key={k} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-500 shrink-0">{c.count} reviews</span>
                    </div>
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* ── Client Health Table ──────────────────────────────────── */}
      <ClientHealthCard health={ov.clientHealth ?? []} loading={ovLoading} />
    </div>
  );
}

/* ── Client Health Table ─────────────────────────────────────── */
function ClientHealthCard({ health, loading }) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? health : health.slice(0, 8);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-sm font-bold text-gray-900">Client Health</CardTitle>
          </div>
          {health.length > 8 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
            >
              {expanded
                ? <><ChevronUp className="h-3 w-3" /> Show less</>
                : <><ChevronDown className="h-3 w-3" /> Show all ({health.length})</>}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        {loading ? <Skeleton className="h-40" /> : health.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-300">No clients yet</div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Business', 'Reviews', 'Feedback', 'Conversion', 'Last Activity', 'Status'].map((h) => (
                  <th key={h} className="pb-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider pr-4 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {display.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 pr-4 font-semibold text-gray-900 max-w-[180px] truncate">{c.businessName}</td>
                  <td className="py-2.5 pr-4 text-green-700 font-bold tabular-nums">{c.totalReviews}</td>
                  <td className="py-2.5 pr-4 text-orange-600 font-bold tabular-nums">{c.totalFeedback}</td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    <span className={cn(
                      'font-bold text-xs',
                      c.conversionRate >= 50 ? 'text-green-600'
                        : c.conversionRate >= 20 ? 'text-amber-600'
                        : 'text-gray-400',
                    )}>
                      {c.conversionRate}%
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400 text-xs whitespace-nowrap">
                    {c.lastActivity
                      ? new Date(c.lastActivity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  <td className="py-2.5">
                    <OBadge status={c.onboardingStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
