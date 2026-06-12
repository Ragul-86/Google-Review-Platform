import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star, Users, Building2, QrCode, ThumbsUp, ThumbsDown,
  TrendingUp, Activity, BarChart3, MessageSquare,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color = 'gray', loading }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'bg-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  ring: 'bg-green-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'bg-amber-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'bg-purple-100' },
    rose:   { bg: 'bg-rose-50',   icon: 'text-rose-600',   ring: 'bg-rose-100' },
    gray:   { bg: 'bg-gray-50',   icon: 'text-gray-600',   ring: 'bg-gray-100' },
  };
  const c = colors[color];
  if (loading) return <Skeleton className="h-28 rounded-2xl" />;
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1.5 leading-none">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl', c.ring)}>
            <Icon className={cn('h-5 w-5', c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

  /* monthly data for chart */
  const monthly = (analytics?.monthly ?? []).map((m) => ({
    month: m.month ?? m._id ?? '',
    reviews: m.count ?? m.reviews ?? 0,
  }));

  /* client growth data */
  const clientGrowth = (analytics?.clientGrowth ?? []).map((m) => ({
    month: m._id ?? m.month ?? '',
    clients: m.count ?? 0,
  }));

  const positive  = analytics?.positive ?? 0;
  const negative  = analytics?.negative ?? 0;
  const totalRev  = (positive + negative) || 1;
  const posRate   = Math.round((positive / totalRev) * 100);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">Real-time metrics across all client accounts</p>
      </div>

      {/* ── 6 KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard loading={loading} icon={Building2} color="blue"   label="Total Clients"   value={overview?.totalClients  ?? 0} sub={`${overview?.activeClients ?? 0} active`} />
        <KpiCard loading={loading} icon={MessageSquare} color="purple" label="Total Reviews" value={overview?.totalReviews ?? 0} sub={`${posRate}% positive`} />
        <KpiCard loading={loading} icon={ThumbsUp}   color="green"  label="Positive Reviews" value={positive} sub={`${posRate}% of total`} />
        <KpiCard loading={loading} icon={ThumbsDown} color="rose"   label="Private Feedback" value={negative} sub={`${100 - posRate}% of total`} />
        <KpiCard loading={loading} icon={Star}       color="amber"  label="Avg Rating"      value={analytics?.avgRating?.toFixed(1) ?? '—'} sub="across all clients" />
        <KpiCard loading={loading} icon={QrCode}     color="gray"   label="QR Codes"        value={overview?.totalQRCodes ?? analytics?.qrCodes ?? 0} sub="across platform" />
      </div>

      {/* ── Charts row ───────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly reviews trend */}
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

        {/* Client growth */}
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

      {/* ── Bottom row: recent activity + top clients ─────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent reviews activity feed */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <CardTitle className="text-sm font-bold text-gray-900">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {ovLoading ? <Skeleton className="h-40" /> :
              (overview?.recentReviews?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-300">No reviews yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(overview?.recentReviews ?? []).map((r) => (
                    <div key={r._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                        r.rating >= 4 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600',
                      )}>
                        {r.rating}★
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">
                          {r.clientId?.businessName ?? '—'}
                        </p>
                        <p className="text-[11px] text-gray-400">{formatDateTime(r.createdAt)}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                        r.type === 'positive'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-600',
                      )}>
                        {r.type === 'positive' ? 'Google' : 'Feedback'}
                      </span>
                    </div>
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
            {ovLoading ? <Skeleton className="h-40" /> :
              (overview?.topClients?.length ?? 0) === 0 ? (
                <div className="py-10 text-center text-sm text-gray-300">No clients yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(overview?.topClients ?? []).map((c, i) => (
                    <div key={c._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                        i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500',
                      )}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{c.businessName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
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
    </div>
  );
}
