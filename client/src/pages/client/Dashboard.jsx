import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, MessageCircle, Star, MessageSquare,
  TrendingUp, BarChart3, ExternalLink,
} from 'lucide-react';

/* ── single stat card ─────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, color = 'text-primary', bg = 'bg-primary/10' }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── progress bar ─────────────────────────────────────────────── */
function FunnelRow({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-400 text-right">{pct}% of customers added</p>
    </div>
  );
}

export default function ClientDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => customersAPI.getAnalytics().then((r) => r.data.data),
  });

  const d = data ?? {};

  const metrics = [
    {
      icon: Users,
      label: 'Customers Added',
      value: d.totalCustomers ?? 0,
      sub: 'Total in database',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Sent',
      value: d.whatsappSent ?? 0,
      sub: 'Review requests sent',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Star,
      label: 'Google Reviews',
      value: d.googleReviews ?? 0,
      sub: '4★–5★ review submitted',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      icon: MessageSquare,
      label: 'Private Feedback',
      value: d.privateFeedback ?? 0,
      sub: '1★–3★ feedback received',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: BarChart3,
      label: 'Total Responses',
      value: d.totalResponses ?? 0,
      sub: 'Google reviews + feedback',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      label: 'Conversion Rate',
      value: `${d.conversionRate ?? 0}%`,
      sub: 'Responses ÷ WA sent',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Customer review journey overview" />

      {/* Metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : metrics.map((m) => <MetricCard key={m.label} {...m} />)
        }
      </div>

      {/* Funnel breakdown */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Customer Journey Funnel</h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-4">
              <FunnelRow label="Customers Added"      count={d.totalCustomers  ?? 0} total={d.totalCustomers ?? 1} color="bg-indigo-400" />
              <FunnelRow label="WhatsApp Sent"        count={d.whatsappSent    ?? 0} total={d.totalCustomers ?? 1} color="bg-green-400" />
              <FunnelRow label="Review Link Opened"   count={d.opened          ?? 0} total={d.totalCustomers ?? 1} color="bg-blue-400" />
              <FunnelRow label="Google Review Submitted" count={d.googleReviews ?? 0} total={d.totalCustomers ?? 1} color="bg-yellow-400" />
              <FunnelRow label="Private Feedback"     count={d.privateFeedback ?? 0} total={d.totalCustomers ?? 1} color="bg-orange-400" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service breakdown */}
      {(d.byService?.length > 0) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance by Service</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Service', 'Customers', 'WA Sent', 'Google Reviews', 'Feedback', 'Conversion'].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4 last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.byService.map((row) => (
                    <tr key={row.service} className="hover:bg-gray-50/50">
                      <td className="py-2.5 pr-4 font-medium text-gray-900 max-w-[160px] truncate">{row.service}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{row.total}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{row.waSent}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-green-700 font-medium">{row.googleReviews}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-orange-700 font-medium">{row.feedback}</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`font-semibold ${row.conversionRate >= 50 ? 'text-green-600' : row.conversionRate >= 25 ? 'text-yellow-600' : 'text-gray-500'}`}>
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

      {/* Quick actions hint */}
      {!isLoading && (d.totalCustomers ?? 0) === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-2">
            <Users className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="font-medium text-gray-600">No customers yet</p>
            <p className="text-sm text-gray-400">
              Go to <strong>Customers</strong> to add your first customer and send a WhatsApp review request.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
