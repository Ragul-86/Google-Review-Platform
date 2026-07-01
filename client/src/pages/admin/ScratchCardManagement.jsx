import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminRewardsAPI, clientsAPI } from '@/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Ticket, Search, Download, Eye, ChevronLeft, ChevronRight, Loader2,
  Gift, Clock, Sparkles, CheckCircle2, XCircle, IndianRupee, Copy,
  TrendingUp, Building2, BarChart2, PieChart as PieChartIcon, FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

/* ── Status config ───────────────────────────────────────────────── */
const STATUS = {
  pending:   { label: 'Pending',   color: 'bg-slate-100 text-slate-600',  dot: '#94a3b8' },
  sent:      { label: 'Sent',      color: 'bg-blue-100 text-blue-700',    dot: '#60a5fa' },
  scratched: { label: 'Opened',    color: 'bg-amber-100 text-amber-700',  dot: '#f59e0b' },
  redeemed:  { label: 'Redeemed',  color: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  expired:   { label: 'Expired',   color: 'bg-red-100 text-red-600',      dot: '#f87171' },
};

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtCurrency(n) {
  if (n == null || n === 0) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ── CSV export ──────────────────────────────────────────────────── */
const EXPORT_HEADERS = [
  'Client Name', 'Business Name', 'Customer Name', 'Mobile Number',
  'Reward Amount', 'Coupon Code', 'Reward Status', 'Created Date',
  'Opened Date', 'Expiry Date', 'Days Remaining',
];

function rowToArr(r) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = r.validUntil ? new Date(r.validUntil) : null; if (expiry) expiry.setHours(0, 0, 0, 0);
  const days = expiry && r.rewardStatus !== 'expired' ? Math.max(0, Math.round((expiry - today) / 86400000)) : 0;
  return [
    r.clientId?.email         || '—',
    r.clientId?.businessName  || '—',
    r.customerName            || '—',
    r.phone                   || '—',
    r.rewardAmount != null ? `₹${r.rewardAmount}` : '—',
    r.couponCode              || '—',
    STATUS[r.rewardStatus]?.label || r.rewardStatus,
    fmtDate(r.createdAt),
    fmtDate(r.scratchedAt),
    fmtDate(r.validUntil),
    r.rewardStatus === 'expired' ? 'Expired' : (r.isScratched ? String(days) : '—'),
  ];
}

function downloadBlob(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(rows) {
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [EXPORT_HEADERS.map(escape).join(','), ...rows.map((r) => rowToArr(r).map(escape).join(','))];
  downloadBlob(lines.join('\n'), 'scratch-cards.csv', 'text/csv');
}

function exportXLS(rows) {
  const xmlRow = (cells) => `<Row>${cells.map((c) => `<Cell><Data ss:Type="String">${String(c).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}</Row>`;
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Scratch Cards"><Table>
${xmlRow(EXPORT_HEADERS)}
${rows.map((r) => xmlRow(rowToArr(r))).join('\n')}
</Table></Worksheet></Workbook>`;
  downloadBlob(xml, 'scratch-cards.xls', 'application/vnd.ms-excel');
}

function exportPDF(rows) {
  const trs = rows.map((r) => `<tr>${rowToArr(r).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Scratch Cards</title>
  <style>body{font-family:sans-serif;font-size:11px;padding:16px}
  table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}
  th{background:#f3f4f6;font-weight:600}</style></head>
  <body><h2 style="margin-bottom:12px">Scratch Card Management — All Records</h2>
  <table><thead><tr>${EXPORT_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${trs}</tbody></table></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
}

/* ── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

/* ── Status badge ───────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', s.color)}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

/* ── Days remaining ─────────────────────────────────────────────────── */
function DaysCell({ row }) {
  if (!row.isScratched) return <span className="text-gray-400">—</span>;
  if (row.rewardStatus === 'expired') return <span className="text-red-500 font-medium text-sm">Expired</span>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp   = new Date(row.validUntil); exp.setHours(0, 0, 0, 0);
  const d = Math.max(0, Math.round((exp - today) / 86400000));
  if (d <= 0) return <span className="text-red-500 font-medium text-sm">Today</span>;
  return <span className={cn('text-sm font-medium', d <= 3 ? 'text-orange-500' : 'text-gray-600')}>{d}d</span>;
}

/* ── Chart card wrapper ──────────────────────────────────────────────── */
function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Super Admin — Scratch Card Management
   Full visibility into every client's reward/scratch-card activity.
   Clients are restricted to their own data via the regular /transactions
   endpoint; this page calls /rewards/admin/* which is superAdmin-only. */
export default function AdminScratchCardManagement() {
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [clientFilter,  setClientFilter]  = useState('');
  const [categoryFilter,setCategoryFilter]= useState('');
  const [dateRange,     setDateRange]     = useState('');
  const [page,          setPage]          = useState(1);
  const [viewTarget,    setViewTarget]    = useState(null);
  const limit = 20;

  // ── Clients (for filter dropdown + derive categories) ──────────────
  const { data: clientsData } = useQuery({
    queryKey: ['all-clients-for-admin'],
    queryFn:  () => clientsAPI.getAll({ limit: 500 }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const allClients = clientsData?.clients ?? clientsData?.data ?? [];

  // Derive unique business categories from loaded clients
  const allCategories = useMemo(() => {
    const cats = [...new Set(allClients.map((c) => c.businessCategory).filter(Boolean))].sort();
    return cats;
  }, [allClients]);

  // ── Main table data ────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['admin-scratch-cards', search, statusFilter, clientFilter, categoryFilter, dateRange, page],
    queryFn: () => adminRewardsAPI.getAll({
      search, status: statusFilter, clientId: clientFilter,
      businessCategory: categoryFilter, dateRange, page, limit,
    }).then((r) => r.data),
    keepPreviousData: true,
  });

  const rows   = data?.data   ?? [];
  const pages  = data?.pages  ?? 1;
  const counts = data?.counts ?? {
    total: 0, pending: 0, sent: 0, scratched: 0, redeemed: 0, expired: 0, distributedValue: 0,
  };

  // ── Analytics / chart data ─────────────────────────────────────────
  const { data: analyticsData } = useQuery({
    queryKey: ['admin-scratch-analytics'],
    queryFn:  () => adminRewardsAPI.getAnalytics().then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const monthly     = analyticsData?.monthly     ?? [];
  const clientWise  = analyticsData?.clientWise  ?? [];
  const distribution= analyticsData?.distribution ?? [];
  const topAmounts  = analyticsData?.topAmounts  ?? [];

  // ── Handlers ─────────────────────────────────────────────────────
  function resetFilters() {
    setSearch(''); setStatusFilter(''); setClientFilter('');
    setCategoryFilter(''); setDateRange(''); setPage(1);
  }

  const anyFilter = !!(search || statusFilter || clientFilter || categoryFilter || dateRange);

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scratch Card Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete visibility into every client's reward & scratch-card activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV(rows)} disabled={rows.length === 0}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export current page as CSV</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportXLS(rows)} disabled={rows.length === 0}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export current page as Excel (.xls)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportPDF(rows)} disabled={rows.length === 0}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print / Save as PDF</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Summary Stat Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Ticket}       label="Total Scratch Cards" value={fmtNum(counts.total)}          iconBg="bg-[#FBBF24]/10" iconColor="text-[#FBBF24]" />
        <StatCard icon={Clock}        label="Pending Rewards"     value={fmtNum(counts.pending)}         iconBg="bg-slate-100"    iconColor="text-slate-500" />
        <StatCard icon={Sparkles}     label="Opened Rewards"      value={fmtNum(counts.scratched)}       iconBg="bg-amber-50"     iconColor="text-amber-500" />
        <StatCard icon={CheckCircle2} label="Redeemed Rewards"    value={fmtNum(counts.redeemed)}        iconBg="bg-emerald-50"   iconColor="text-emerald-600" />
        <StatCard icon={XCircle}      label="Expired Rewards"     value={fmtNum(counts.expired)}         iconBg="bg-red-50"       iconColor="text-red-500" />
        <StatCard icon={IndianRupee}  label="Total Value Distributed" value={fmtCurrency(counts.distributedValue)}
          sub="Across all scratched cards" iconBg="bg-violet-50" iconColor="text-violet-600" />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 h-9"
              placeholder="Name, mobile, coupon…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Client filter */}
          <Select value={clientFilter || 'all'} onValueChange={(v) => { setClientFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All Clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {allClients.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.businessName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Business Category filter */}
          <Select value={categoryFilter || 'all'} onValueChange={(v) => { setCategoryFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="redeemed">Redeemed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range */}
          <Select value={dateRange || 'all'} onValueChange={(v) => { setDateRange(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {anyFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-gray-500">
              Clear filters
            </Button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {data?.total ?? 0} result{data?.total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center">
              <Ticket className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-400">No scratch cards found</p>
              {anyFilter && (
                <p className="text-sm text-gray-300 mt-1">
                  Try clearing your filters
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-600 pl-5">Client Name</TableHead>
                  <TableHead className="font-semibold text-gray-600">Business Name</TableHead>
                  <TableHead className="font-semibold text-gray-600">Customer Name</TableHead>
                  <TableHead className="font-semibold text-gray-600">Mobile</TableHead>
                  <TableHead className="font-semibold text-gray-600">Reward</TableHead>
                  <TableHead className="font-semibold text-gray-600">Coupon Code</TableHead>
                  <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="font-semibold text-gray-600">Created</TableHead>
                  <TableHead className="font-semibold text-gray-600">Opened</TableHead>
                  <TableHead className="font-semibold text-gray-600">Expiry</TableHead>
                  <TableHead className="font-semibold text-gray-600">Days Left</TableHead>
                  <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r._id} className="hover:bg-gray-50/60 transition-colors">
                    <TableCell className="pl-5 text-sm text-gray-500 max-w-[140px] truncate">
                      {r.clientId?.email || '—'}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 max-w-[160px] truncate">
                      {r.clientId?.businessName || '—'}
                    </TableCell>
                    <TableCell className="text-gray-800">{r.customerName}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{r.phone}</TableCell>
                    <TableCell className="font-semibold text-amber-600">
                      {r.isScratched ? `₹${r.rewardAmount}` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-700">{r.couponCode || '—'}</TableCell>
                    <TableCell><StatusBadge status={r.rewardStatus} /></TableCell>
                    <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.createdAt)}</TableCell>
                    <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.scratchedAt)}</TableCell>
                    <TableCell className="text-gray-500 text-sm whitespace-nowrap">{fmtDate(r.validUntil)}</TableCell>
                    <TableCell><DaysCell row={r} /></TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="View Details"
                            onClick={() => setViewTarget(r)}
                            className={cn(
                              'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                              'shadow-sm text-blue-600 bg-blue-50 hover:bg-blue-100',
                              'transition-all duration-150 hover:scale-110 hover:shadow-md active:scale-95',
                            )}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Reward Distribution (Pie) */}
        <ChartCard title="Reward Distribution" icon={PieChartIcon}>
          {distribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => <span style={{ fontSize: 12, color: '#6b7280' }}>{v}</span>}
                />
                <RTooltip formatter={(val, name) => [`${val} cards`, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Monthly Reward Analytics (Bar + Line combo) */}
        <ChartCard title="Monthly Reward Analytics" icon={TrendingUp}>
          {monthly.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total"    name="Total"    fill="#FBBF24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="redeemed" name="Redeemed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Client-wise Reward Analytics */}
        <ChartCard title="Client-wise Reward Analytics" icon={Building2}>
          {clientWise.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clientWise} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v) => v.length > 14 ? `${v.slice(0, 14)}…` : v}
                />
                <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total"    name="Total"    fill="#60a5fa" radius={[0, 4, 4, 0]} />
                <Bar dataKey="redeemed" name="Redeemed" fill="#34d399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top Reward Amounts */}
        <ChartCard title="Top Reward Amounts" icon={BarChart2}>
          {topAmounts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAmounts} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="amount" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <RTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(val) => [`${val} cards`, 'Count']} />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Cards" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

      {/* ── View Details Modal ───────────────────────────────────────── */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-amber-500" />
              Scratch Card Details
            </DialogTitle>
          </DialogHeader>
          {viewTarget && (() => {
            const scratchCardUrl = `${window.location.origin}/reward/${viewTarget.token}`;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const exp   = viewTarget.validUntil ? new Date(viewTarget.validUntil) : null;
            if (exp) exp.setHours(0, 0, 0, 0);
            const daysLeft = exp && viewTarget.rewardStatus !== 'expired'
              ? Math.max(0, Math.round((exp - today) / 86400000))
              : null;
            return (
              <div className="space-y-0 divide-y divide-gray-100 text-sm">
                {[
                  ['Business Name',  viewTarget.clientId?.businessName || '—'],
                  ['Client Name',    viewTarget.clientId?.email        || '—'],
                  ['Customer Name',  viewTarget.customerName],
                  ['Mobile Number',  viewTarget.phone],
                  ['Reward Amount',  viewTarget.isScratched ? `₹${viewTarget.rewardAmount}` : 'Not opened yet'],
                  ['Coupon Code',    viewTarget.couponCode || '—'],
                  ['Created Date',   fmtDate(viewTarget.createdAt)],
                  ['Opened Date',    fmtDate(viewTarget.scratchedAt)],
                  ['Redeemed Date',  fmtDate(viewTarget.redeemedAt)],
                  ['Expiry Date',    fmtDate(viewTarget.validUntil)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-2.5 gap-3">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className={cn(
                      'text-right font-medium',
                      label === 'Reward Amount' && viewTarget.isScratched && 'text-amber-600 font-semibold',
                      label === 'Coupon Code'   && 'font-mono text-xs',
                    )}>
                      {val}
                    </span>
                  </div>
                ))}

                {/* Scratch Card Link — copy-only to avoid accidentally consuming the one-time scratch */}
                <div className="flex justify-between items-start py-2.5 gap-3">
                  <span className="text-gray-500 shrink-0">Scratch Card Link</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs text-gray-600 truncate max-w-[180px]">{scratchCardUrl}</span>
                    <button
                      type="button"
                      title="Copy link"
                      onClick={() => {
                        navigator.clipboard.writeText(scratchCardUrl);
                      }}
                      className="p-1 rounded hover:bg-gray-100 shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Reward Status */}
                <div className="flex justify-between items-center py-2.5 gap-3">
                  <span className="text-gray-500">Reward Status</span>
                  <StatusBadge status={viewTarget.rewardStatus} />
                </div>

                {/* Days Remaining (only if relevant) */}
                {daysLeft !== null && (
                  <div className="flex justify-between items-center py-2.5 gap-3">
                    <span className="text-gray-500">Days Remaining</span>
                    <DaysCell row={viewTarget} />
                  </div>
                )}

                {/* Contextual note */}
                {viewTarget.rewardStatus === 'expired' && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-1">
                    This reward expired on {fmtDate(viewTarget.validUntil)}.
                  </p>
                )}
                {!viewTarget.isScratched && viewTarget.rewardStatus !== 'expired' && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-1">
                    Waiting for the customer to open the link and scratch the card.
                  </p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
    </TooltipProvider>
  );
}
