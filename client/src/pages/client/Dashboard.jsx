import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, MessageCircle, Star, MessageSquare,
  TrendingUp, BarChart3, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Time-based greeting ───────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ── Metric card ───────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, color, bg, trend }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110',
            bg,
          )}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
              trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
            )}>
              <ArrowUpRight className={cn('h-3 w-3', trend < 0 && 'rotate-90')} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{value}</p>
        <p className="text-[13px] font-semibold text-gray-700 mt-1.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Funnel step row ───────────────────────────────────────────── */
function FunnelRow({ label, count, total, color }) {
  const ofAll = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">{ofAll}% of total</span>
          <span className="text-gray-900 font-bold tabular-nums">{count}</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${ofAll}%` }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function ClientDashboard() {
  const { user } = useAuth();
  const businessName = user?.client?.businessName || 'Business';

  const { data, isLoading } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => customersAPI.getAnalytics().then((r) => r.data.data),
  });

  const d = data ?? {};

  const metrics = [
    {
      icon: Users, label: 'Customers Added', value: d.totalCustomers ?? 0,
      sub: 'Total in database', color: 'text-indigo-600', bg: 'bg-indigo-50',
    },
    {
      icon: MessageCircle, label: 'WhatsApp Sent', value: d.whatsappSent ?? 0,
      sub: 'Review requests sent', color: 'text-green-600', bg: 'bg-green-50',
    },
    {
      icon: Star, label: 'Google Reviews', value: d.googleReviews ?? 0,
      sub: '4 - 5 star submitted', color: 'text-yellow-600', bg: 'bg-yellow-50',
    },
    {
      icon: MessageSquare, label: 'Private Feedback', value: d.privateFeedback ?? 0,
      sub: '1 - 3 star received', color: 'text-orange-600', bg: 'bg-orange-50',
    },
    {
      icon: BarChart3, label: 'Total Responses', value: d.totalResponses ?? 0,
      sub: 'Reviews + feedback', color: 'text-blue-600', bg: 'bg-blue-50',
    },
    {
      icon: TrendingUp, label: 'Conversion Rate', value: `${d.conversionRate ?? 0}%`,
      sub: 'Responses / WA sent', color: 'text-primary', bg: 'bg-primary/10',
    },
  ];

  const hasData = (d.totalCustomers ?? 0) > 0;

  return (
    <div className="space-y-7">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] md:text-[30px] font-bold text-gray-900 leading-tight tracking-tight">
            {getGreeting()}, {businessName}
          </h1>
          <p className="text-[14px] text-gray-500 mt-1.5 leading-relaxed">
            Manage reviews, feedback, customers, and your business reputation — all in one place.
          </p>
        </div>
        {!isLoading && hasData && (
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {d.conversionRate ?? 0}% conversion
          </div>
        )}
      </div>

      {/* ── KPI grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-11 w-11 rounded-xl mb-3" />
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3.5 w-28" />
                </CardContent>
              </Card>
            ))
          : metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* ── Customer Journey Funnel ─────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Customer Journey Funnel</h2>
              <p className="text-xs text-gray-400 mt-0.5">From first contact to review submission</p>
            </div>
            {hasData && (
              <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                {d.totalCustomers} customers
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
            </div>
          ) : !hasData ? (
            <div className="py-8 text-center space-y-2">
              <Users className="h-9 w-9 text-gray-200 mx-auto" />
              <p className="text-sm font-medium text-gray-400">No customers yet</p>
              <p className="text-xs text-gray-300">Add customers and send WhatsApp review requests to see funnel data.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <FunnelRow label="Customers Added"         count={d.totalCustomers  ?? 0} total={d.totalCustomers ?? 1} color="bg-indigo-400" />
              <FunnelRow label="WhatsApp Sent"           count={d.whatsappSent    ?? 0} total={d.totalCustomers ?? 1} color="bg-green-400" />
              <FunnelRow label="Review Link Opened"      count={d.opened          ?? 0} total={d.totalCustomers ?? 1} color="bg-blue-400" />
              <FunnelRow label="Google Review Submitted" count={d.googleReviews   ?? 0} total={d.totalCustomers ?? 1} color="bg-yellow-400" />
              <FunnelRow label="Private Feedback Sent"   count={d.privateFeedback ?? 0} total={d.totalCustomers ?? 1} color="bg-orange-400" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Service performance table ───────────────────────────── */}
      {(d.byService?.length ?? 0) > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4">Performance by Service</h2>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Service', 'Customers', 'WA Sent', 'Google Reviews', 'Feedback', 'Conversion'].map((h) => (
                      <th key={h} className="pb-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider pr-4 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.byService.map((row) => (
                    <tr key={row.service} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-gray-900 max-w-[160px] truncate">{row.service}</td>
                      <td className="py-3 pr-4 text-gray-600 tabular-nums">{row.total}</td>
                      <td className="py-3 pr-4 text-gray-600 tabular-nums">{row.waSent}</td>
                      <td className="py-3 pr-4"><span className="text-green-700 font-semibold tabular-nums">{row.googleReviews}</span></td>
                      <td className="py-3 pr-4"><span className="text-orange-700 font-semibold tabular-nums">{row.feedback}</span></td>
                      <td className="py-3">
                        <span className={cn(
                          'font-bold tabular-nums',
                          row.conversionRate >= 50 ? 'text-green-600'
                          : row.conversionRate >= 25 ? 'text-yellow-600'
                          : 'text-gray-400',
                        )}>
                          {row.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
