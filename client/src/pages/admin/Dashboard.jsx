import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, reportsAPI } from '@/api';
import { toast } from 'sonner';
import {
  Users, Star, MessageSquare, Send, UserPlus, QrCode,
  TrendingUp, Activity, FileDown, ArrowUpRight, Clock,
  CheckCircle2, AlertCircle, ChevronRight, BarChart2,
  Building2, Download, RefreshCw, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';


/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }
function fmtDate(d) {
  if (!d) return '—';
  try {
    const diff = Date.now() - new Date(d).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    const day = Math.floor(h / 24);
    if (day < 30) return `${day}d ago`;
    const mo = Math.floor(day / 30);
    if (mo < 12)  return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
  } catch { return '—'; }
}
function downloadBlob(data, filename) {
  const url = URL.createObjectURL(new Blob([data]));
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */
function KPICard({ icon: Icon, label, value, sub, color = 'gold' }) {
  const colors = {
    gold:  { bg: 'bg-[#FBBF24]/10', icon: 'text-[#FBBF24]', ring: 'ring-[#FBBF24]/20' },
    green: { bg: 'bg-emerald-50',   icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    blue:  { bg: 'bg-blue-50',      icon: 'text-blue-600',    ring: 'ring-blue-100' },
    violet:{ bg: 'bg-violet-50',    icon: 'text-violet-600',  ring: 'ring-violet-100' },
    rose:  { bg: 'bg-rose-50',      icon: 'text-rose-600',    ring: 'ring-rose-100' },
    sky:   { bg: 'bg-sky-50',       icon: 'text-sky-600',     ring: 'ring-sky-100' },
  };
  const c = colors[color] || colors.gold;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl ring-1', c.bg, c.ring)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900 font-sora">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Today mini card ──────────────────────────────────────────────────────── */
function TodayCard({ icon: Icon, label, value, color }) {
  const colors = {
    gold:  'text-[#FBBF24] bg-[#FBBF24]/10',
    green: 'text-emerald-400 bg-emerald-400/10',
    blue:  'text-blue-400 bg-blue-400/10',
    violet:'text-violet-400 bg-violet-400/10',
  };
  return (
    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', colors[color] || colors.gold)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-white font-bold text-xl font-sora leading-none">{value ?? 0}</div>
        <div className="text-white/50 text-xs mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ── Funnel bar ───────────────────────────────────────────────────────────── */
function FunnelRow({ label, count, total, color }) {
  const width = pct(count, total);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-900 font-sora">{fmtNum(count)}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-400">{width}% of added</div>
    </div>
  );
}

/* ── Activity icon ────────────────────────────────────────────────────────── */
function ActivityIcon({ type }) {
  if (type === 'google_review') return (
    <div className="h-8 w-8 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
      <Star className="h-3.5 w-3.5 text-emerald-600" />
    </div>
  );
  if (type === 'private_feedback') return (
    <div className="h-8 w-8 rounded-full bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
      <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
    </div>
  );
  return (
    <div className="h-8 w-8 rounded-full bg-[#FBBF24]/10 ring-1 ring-[#FBBF24]/20 flex items-center justify-center shrink-0">
      <Building2 className="h-3.5 w-3.5 text-[#FBBF24]" />
    </div>
  );
}

/* ── Export button ────────────────────────────────────────────────────────── */
function ExportBtn({ label, icon: Icon = FileDown, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
    >
      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {loading
        ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-400" />
        : <Download className="h-3.5 w-3.5 text-gray-300" />}
    </button>
  );
}

/* ── Status pill ──────────────────────────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    active:    'bg-emerald-50 text-emerald-700',
    inactive:  'bg-gray-100 text-gray-500',
    setup:     'bg-blue-50 text-blue-700',
    pending:   'bg-amber-50 text-amber-700',
    suspended: 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize', map[status] || map.pending)}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: raw, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview'],
    queryFn:  () => analyticsAPI.overview().then((r) => r.data?.data || r.data),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const [exportLoading, setExportLoading] = React.useState({});
  const doExport = async (key, apiFn, filename, params = {}) => {
    setExportLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await apiFn(params);
      downloadBlob(res.data, filename);
    } catch {
      toast.error('Export failed');
    } finally {
      setExportLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const d        = raw || {};
  const today    = d.today    || {};
  const funnel   = d.funnel   || {};
  const activity = d.recentActivity || [];
  const reviews  = d.latestReviews  || [];
  const feedback = d.latestFeedback || [];
  const health   = d.clientHealth   || [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[#FBBF24] border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900 font-sora leading-tight">Platform Overview</h2>
          <p className="text-sm text-gray-400 mt-0.5">Real-time metrics across all client accounts</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* ── 6 KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={Building2}     label="Total Clients"   value={fmtNum(d.totalClients)}   color="gold"   sub={`${d.activeClients ?? 0} active`} />
        <KPICard icon={TrendingUp}    label="Active Clients"  value={fmtNum(d.activeClients)}  color="green"  sub={`${pct(d.activeClients, d.totalClients)}% of total`} />
        <KPICard icon={Star}          label="Google Reviews"  value={fmtNum(d.totalReviews)}   color="gold"   sub="All-time positive" />
        <KPICard icon={MessageSquare} label="Pvt Feedback"    value={fmtNum(d.totalFeedback)}  color="blue"   sub="All-time" />
        <KPICard icon={UserPlus}      label="Customers Added" value={fmtNum(d.totalCustomers)} color="violet" sub="Across all clients" />
        <KPICard icon={Send}          label="WhatsApp Sent"   value={fmtNum(d.totalWaSent)}    color="sky"    sub={`${pct(d.totalWaSent, d.totalCustomers)}% of customers`} />
      </div>

      {/* ── Today's Snapshot ─────────────────────────────────────────────── */}
      <div className="bg-[#111111] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-[#FBBF24]" />
          <h3 className="text-white font-bold text-sm font-sora tracking-wide">TODAY'S SNAPSHOT</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <TodayCard icon={Building2}     label="New Clients"  value={today.clients}  color="gold" />
          <TodayCard icon={Star}          label="Reviews"      value={today.reviews}  color="green" />
          <TodayCard icon={MessageSquare} label="Feedback"     value={today.feedback} color="blue" />
          <TodayCard icon={Send}          label="WA Sent"      value={today.waSent}   color="violet" />
        </div>
      </div>

      {/* ── Funnel + Activity Feed ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="h-4 w-4 text-[#FBBF24]" />
            <h3 className="font-bold text-gray-900 text-sm font-sora">REVIEW CONVERSION FUNNEL</h3>
          </div>
          <div className="space-y-5">
            <FunnelRow label="Customers Added"      count={funnel.customersAdded} total={funnel.customersAdded} color="bg-[#FBBF24]" />
            <FunnelRow label="WhatsApp Sent"        count={funnel.waSent}         total={funnel.customersAdded} color="bg-amber-400" />
            <FunnelRow label="Review Link Opened"   count={funnel.opened}         total={funnel.customersAdded} color="bg-blue-400" />
            <FunnelRow label="Review Submitted"     count={funnel.submitted}      total={funnel.customersAdded} color="bg-emerald-500" />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Overall conversion rate</span>
            <span className="font-bold text-emerald-700 font-sora text-base">
              {pct(funnel.submitted, funnel.customersAdded)}%
            </span>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#FBBF24]" />
              <h3 className="font-bold text-gray-900 text-sm font-sora">RECENT ACTIVITY</h3>
            </div>
            <button
              onClick={() => navigate('/admin/reviews')}
              className="text-xs text-gray-400 hover:text-[#FBBF24] transition-colors flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {activity.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No activity yet</p>
            )}
            {activity.map((item, i) => (
              <div key={`${item._id}-${i}`} className="flex items-start gap-3 py-3">
                <ActivityIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-700 truncate">{item.businessName}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">{fmtDate(item.createdAt)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span className={cn('font-medium',
                      item.type === 'google_review'   && 'text-emerald-600',
                      item.type === 'private_feedback' && 'text-blue-600',
                      item.type === 'client_created'   && 'text-[#FBBF24]')}>
                      {item.label}
                    </span>
                    {item.detail && <span> · {item.detail}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Latest Google Reviews ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#FBBF24]" />
            <h3 className="font-bold text-gray-900 text-sm font-sora">LATEST GOOGLE REVIEWS</h3>
          </div>
          <button onClick={() => navigate('/admin/reviews')} className="text-xs text-gray-400 hover:text-[#FBBF24] transition-colors flex items-center gap-1">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Business', 'Customer', 'Service', 'Rating', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reviews.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No reviews yet</td></tr>
              )}
              {reviews.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[140px]">{r.clientId?.businessName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.customerName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.categoryLabel || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-3 w-3', i < (r.rating || 5) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-gray-200')} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Latest Private Feedback ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm font-sora">LATEST PRIVATE FEEDBACK</h3>
          </div>
          <button onClick={() => navigate('/admin/reviews')} className="text-xs text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Business', 'Customer', 'Category', 'Preview', 'Rating', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {feedback.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No feedback yet</td></tr>
              )}
              {feedback.map((f) => (
                <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[140px]">{f.clientId?.businessName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.customerName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{f.categoryLabel || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px]">
                    <span className="truncate block">{(f.feedback || '').slice(0, 60)}{f.feedback?.length > 60 ? '…' : ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-3 w-3', i < (f.rating || 3) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-gray-200')} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(f.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick Actions + Export Center ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-[#FBBF24]" />
            <h3 className="font-bold text-gray-900 text-sm font-sora">QUICK ACTIONS</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add New Client',     icon: UserPlus,   color: 'bg-[#FBBF24] text-[#111111]', action: () => navigate('/admin/clients') },
              { label: 'Manage Clients',     icon: Building2,  color: 'bg-[#111111] text-white',      action: () => navigate('/admin/clients') },
              { label: 'View All Reviews',   icon: Star,       color: 'bg-emerald-600 text-white',    action: () => navigate('/admin/reviews') },
              { label: 'Platform Analytics', icon: TrendingUp, color: 'bg-blue-600 text-white',       action: () => navigate('/admin/analytics') },
            ].map(({ label, icon: Icon, color, action }) => (
              <button
                key={label}
                onClick={action}
                className={cn('flex items-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]', color)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Export Center */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileDown className="h-4 w-4 text-[#FBBF24]" />
            <h3 className="font-bold text-gray-900 text-sm font-sora">EXPORT CENTER</h3>
          </div>
          <div className="space-y-2">
            <ExportBtn label="Export All Clients"      loading={exportLoading.clients}   onClick={() => doExport('clients',   reportsAPI.exportClients,   `clients-${Date.now()}.xlsx`)} />
            <ExportBtn label="Export Google Reviews"   loading={exportLoading.reviews}   onClick={() => doExport('reviews',   reportsAPI.exportReviews,   `reviews-${Date.now()}.xlsx`)} />
            <ExportBtn label="Export Private Feedback" loading={exportLoading.feedback}  onClick={() => doExport('feedback',  reportsAPI.exportFeedback,  `feedback-${Date.now()}.xlsx`)} />
            <ExportBtn label="Export All Customers"    loading={exportLoading.customers} onClick={() => doExport('customers', reportsAPI.exportCustomers, `customers-${Date.now()}.xlsx`)} />
            <ExportBtn label="Full Platform Report"    icon={Download} loading={exportLoading.full} onClick={() => doExport('full', reportsAPI.exportFull, `full-report-${Date.now()}.xlsx`)} />
          </div>
        </div>
      </div>

      {/* ── Client Health Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#FBBF24]" />
            <h3 className="font-bold text-gray-900 text-sm font-sora">CLIENT HEALTH</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{health.length}</span>
          </div>
          <button onClick={() => navigate('/admin/clients')} className="text-xs text-gray-400 hover:text-[#FBBF24] transition-colors flex items-center gap-1">
            Manage all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Business', 'Status', 'Customers', 'Reviews', 'Feedback', 'Conversion', 'Last Activity'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {health.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No clients yet</td></tr>
              )}
              {health.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-[#111111] flex items-center justify-center shrink-0">
                        <span className="text-[#FBBF24] text-xs font-bold font-sora">
                          {(c.businessName || 'B')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{c.businessName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 font-sora">{c.customers}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-700 font-sora">{c.totalReviews}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-700 font-sora">{c.totalFeedback}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[60px]">
                        <div className="h-full bg-[#FBBF24] rounded-full" style={{ width: `${Math.min(c.conversionRate, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{c.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(c.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
