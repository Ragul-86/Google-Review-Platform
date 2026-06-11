import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersAPI, servicesAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { WhatsAppSendDialog } from '@/components/WhatsAppSendDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users, Plus, Search, MessageCircle, Trash2,
  UserCheck, Send, Star, TrendingUp, Pencil, ChevronDown, X,
  Wrench, BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const today = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  name: '', phone: '', email: '',
  service: '', serviceId: null,
  visitDate: today, notes: '',
};

const WA_BADGE = {
  pending:  { label: 'Pending',  color: 'bg-gray-100 text-gray-600' },
  sent:     { label: 'Sent',     color: 'bg-blue-100 text-blue-700' },
  clicked:  { label: 'Clicked',  color: 'bg-yellow-100 text-yellow-700' },
  reviewed: { label: 'Reviewed', color: 'bg-green-100 text-green-700' },
};

const REV_BADGE = {
  pending:   { label: 'Pending',   color: 'bg-gray-100 text-gray-500' },
  submitted: { label: 'Submitted', color: 'bg-green-100 text-green-700' },
};

/* ─────────────────────────────────────────────────────────────
   StatusPill
───────────────────────────────────────────────────────────── */
function StatusPill({ map, value }) {
  const b = map[value] ?? map.pending;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', b.color)}>
      {b.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   StatCard
───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   ServiceSelect  (defined OUTSIDE parent — stable ref)
   Props:
     value       – current service name string
     serviceId   – current service _id
     onChange    – (name, id) => void
     services    – array of { _id, name } from API
     loading     – boolean
───────────────────────────────────────────────────────────── */
const CUSTOM_VALUE = '__custom__';

function ServiceSelect({ value, serviceId, onChange, services, loading }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  // Determine current select value:
  // If value matches one of the service names → that service's _id
  // If value is set but no match → CUSTOM_VALUE
  // Otherwise → ''
  const matchedService = services.find((s) => s._id === serviceId || s.name === value);
  const selectVal = matchedService ? matchedService._id : (value ? CUSTOM_VALUE : '');

  function handleSelect(e) {
    const val = e.target.value;
    if (!val) {
      setShowCustom(false);
      onChange('', null);
    } else if (val === CUSTOM_VALUE) {
      setShowCustom(true);
      onChange(customText, null);
    } else {
      setShowCustom(false);
      const svc = services.find((s) => s._id === val);
      if (svc) onChange(svc.name, svc._id);
    }
  }

  function handleCustomChange(e) {
    const v = e.target.value;
    setCustomText(v);
    onChange(v, null);
  }

  // If coming from edit and value doesn't match any service, show custom input
  const effectiveShowCustom = showCustom || (value && !matchedService && value !== '');

  if (loading) {
    return <div className="h-9 rounded-lg bg-gray-100 animate-pulse" />;
  }

  if (services.length === 0) {
    return (
      <div className="space-y-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value, null)}
          placeholder="e.g. Hair Cut, Consultation…"
        />
        <p className="text-xs text-gray-400">
          💡 Add services in <span className="font-medium">Settings → Services</span> for a dropdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={selectVal}
          onChange={handleSelect}
          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
        >
          <option value="">Select a service…</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
          <option value={CUSTOM_VALUE}>Other / Custom…</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {effectiveShowCustom && (
        <div className="relative">
          <Input
            value={value && !matchedService ? value : customText}
            onChange={handleCustomChange}
            placeholder="Enter custom service name…"
            autoFocus
          />
          {(value || customText) && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setCustomText(''); onChange('', null); setShowCustom(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CustomerForm  (defined OUTSIDE parent — fixes focus loss)
───────────────────────────────────────────────────────────── */
function CustomerForm({ values, onFieldChange, onSubmit, loading, submitLabel, services, servicesLoading }) {
  return (
    <div className="space-y-3 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Customer Name *</Label>
          <Input
            value={values.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input
            value={values.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            placeholder="+91 9876543210"
          />
        </div>
      </div>

      <div>
        <Label>Email (optional)</Label>
        <Input
          type="email"
          value={values.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          placeholder="john@example.com"
        />
      </div>

      <div>
        <Label>Service *</Label>
        <ServiceSelect
          value={values.service}
          serviceId={values.serviceId}
          onChange={(name, id) => {
            onFieldChange('service', name);
            onFieldChange('serviceId', id);
          }}
          services={services}
          loading={servicesLoading}
        />
      </div>

      <div>
        <Label>Visit Date</Label>
        <Input
          type="date"
          value={values.visitDate}
          onChange={(e) => onFieldChange('visitDate', e.target.value)}
        />
      </div>

      <div>
        <Label>Notes (optional)</Label>
        <Textarea
          rows={2}
          value={values.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Any additional notes…"
        />
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={loading}>
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function ClientCustomers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const client = user?.client;

  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [addOpen, setAddOpen]           = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [waSendTarget, setWaSendTarget] = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [editForm, setEditForm]         = useState(EMPTY_FORM);

  // Stable field-change handlers (won't cause CustomerForm remount)
  const handleAddField  = useCallback((key, val) => setForm((p)     => ({ ...p, [key]: val })), []);
  const handleEditField = useCallback((key, val) => setEditForm((p) => ({ ...p, [key]: val })), []);

  /* ── Queries ──────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customersAPI.getAll({ search, page, limit: 20 }).then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => customersAPI.getAnalytics().then((r) => r.data.data),
  });

  // Load active services for the dropdown
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services-active'],
    queryFn: () => servicesAPI.getAll({ status: 'active' }).then((r) => r.data.data ?? []),
    staleTime: 60_000,
  });
  const activeServices = servicesData ?? [];

  /* ── Mutations ────────────────────────────────────────────── */
  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['customers'] });
    qc.invalidateQueries({ queryKey: ['customer-analytics'] });
  }, [qc]);

  const createMut = useMutation({
    mutationFn: (payload) => customersAPI.create({
      ...payload,
      service: payload.service,   // controller maps this → serviceName
    }),
    onSuccess: () => {
      toast.success('Customer added');
      setAddOpen(false);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => customersAPI.update(id, data),
    onSuccess: () => {
      toast.success('Customer updated');
      setEditCustomer(null);
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: customersAPI.delete,
    onSuccess: () => { toast.success('Deleted'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const waMut = useMutation({
    mutationFn: customersAPI.markWhatsapp,
    onSuccess: () => invalidate(),
  });

  /* ── Open edit ────────────────────────────────────────────── */
  function openEdit(c) {
    setEditCustomer(c);
    setEditForm({
      name:      c.name,
      phone:     c.phone,
      email:     c.email || '',
      service:   c.serviceName || c.purposeOfVisit || '',
      serviceId: c.serviceId || null,
      visitDate: c.visitDate ? c.visitDate.split('T')[0] : today,
      notes:     c.notes || '',
    });
  }

  const customers = data?.data  ?? [];
  const pages     = data?.pages ?? 1;
  const byService = stats?.byService ?? [];

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage customers and send WhatsApp review requests</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setForm(EMPTY_FORM); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
            <CustomerForm
              values={form}
              onFieldChange={handleAddField}
              onSubmit={() => {
                if (!form.name || !form.phone || !form.service)
                  return toast.error('Name, phone, and service are required');
                createMut.mutate(form);
              }}
              loading={createMut.isPending}
              submitLabel="Add Customer"
              services={activeServices}
              servicesLoading={servicesLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Analytics cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={UserCheck}  label="Customers Added"   value={stats?.totalCustomers   ?? 0}     color="bg-blue-500" />
        <StatCard icon={Send}       label="WhatsApp Sent"     value={stats?.whatsappSent     ?? 0}     color="bg-green-500" />
        <StatCard icon={Star}       label="Reviews Submitted" value={stats?.reviewsSubmitted ?? 0}     color="bg-yellow-500" />
        <StatCard icon={TrendingUp} label="Conversion Rate"   value={`${stats?.conversionRate ?? 0}%`} color="bg-purple-500" />
      </div>

      {/* ── Service Analytics Breakdown ──────────────────────── */}
      {byService.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-semibold text-gray-800">Review Performance by Service</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Service', 'Customers', 'WhatsApp Sent', 'Reviews', 'Conversion'].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byService.map((row) => (
                    <tr key={row.service} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-gray-900 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {row.service}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700">{row.total}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{row.waSent}</td>
                      <td className="py-2.5 pr-4 text-gray-700">{row.reviewed}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 max-w-[80px]">
                            <div
                              className="h-1.5 rounded-full bg-purple-500"
                              style={{ width: `${row.conversionRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{row.conversionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search ──────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone, service…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* ── Customer list ───────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No customers yet</p>
            <p className="text-sm text-gray-400">Add a customer to send them a WhatsApp review request.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-100 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Phone', 'Service', 'Visit Date', 'WhatsApp', 'Review', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => {
                  const svcLabel = c.serviceName || c.purposeOfVisit || '—';
                  return (
                    <tr key={c._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.email && <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.phone}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{svcLabel}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {c.visitDate ? new Date(c.visitDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusPill map={WA_BADGE} value={c.whatsappStatus} /></td>
                      <td className="px-4 py-3"><StatusPill map={REV_BADGE} value={c.reviewStatus} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Send WhatsApp review request"
                            onClick={() => setWaSendTarget(c)}
                            className="h-8 w-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            title="Edit customer"
                            onClick={() => openEdit(c)}
                            className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete customer"
                            onClick={() => { if (window.confirm(`Delete ${c.name}?`)) deleteMut.mutate(c._id); }}
                            className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {customers.map((c) => {
              const svcLabel = c.serviceName || c.purposeOfVisit || '';
              return (
                <Card key={c._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{c.phone}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setWaSendTarget(c)}
                          className="h-8 w-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete ${c.name}?`)) deleteMut.mutate(c._id); }}
                          className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {svcLabel && <p className="text-sm text-gray-600 mb-2 line-clamp-1">{svcLabel}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusPill map={WA_BADGE} value={c.whatsappStatus} />
                      <StatusPill map={REV_BADGE} value={c.reviewStatus} />
                      {c.visitDate && (
                        <span className="text-xs text-gray-400">{new Date(c.visitDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1}    onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Edit dialog ─────────────────────────────────────── */}
      <Dialog open={!!editCustomer} onOpenChange={(o) => !o && setEditCustomer(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <CustomerForm
            values={editForm}
            onFieldChange={handleEditField}
            onSubmit={() => {
              if (!editForm.name || !editForm.phone || !editForm.service)
                return toast.error('Name, phone, and service are required');
              updateMut.mutate({ id: editCustomer._id, data: {
                name:      editForm.name,
                phone:     editForm.phone,
                email:     editForm.email,
                service:   editForm.service,
                serviceId: editForm.serviceId,
                visitDate: editForm.visitDate,
                notes:     editForm.notes,
              }});
            }}
            loading={updateMut.isPending}
            submitLabel="Save Changes"
            services={activeServices}
            servicesLoading={servicesLoading}
          />
        </DialogContent>
      </Dialog>

      {/* ── WhatsApp Send Dialog ─────────────────────────────── */}
      <WhatsAppSendDialog
        open={!!waSendTarget}
        onClose={() => setWaSendTarget(null)}
        customer={waSendTarget}
        client={client}
        onSent={() => {
          if (waSendTarget) waMut.mutate(waSendTarget._id);
        }}
      />
    </div>
  );
}
