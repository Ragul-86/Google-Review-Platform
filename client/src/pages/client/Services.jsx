import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Wrench, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Constants ──────────────────────────────────────────────── */
const EMPTY = { name: '', description: '', category: '' };

/* ── ServiceForm  (outside parent to prevent remount on render) */
function ServiceForm({ values, onFieldChange, onSubmit, loading, submitLabel }) {
  return (
    <div className="space-y-3 mt-2">
      <div>
        <Label>Service Name *</Label>
        <Input
          value={values.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="e.g. Hair Cut, Dental Checkup, SEO Package"
        />
      </div>
      <div>
        <Label>Category (optional)</Label>
        <Input
          value={values.category}
          onChange={(e) => onFieldChange('category', e.target.value)}
          placeholder="e.g. Hair Services, Medical, Digital Marketing"
        />
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea
          rows={3}
          value={values.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Brief description of this service…"
          className="resize-none"
        />
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : submitLabel}
      </Button>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function ClientServices() {
  const qc = useQueryClient();

  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('');
  const [addOpen, setAddOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [editForm, setEditForm]   = useState(EMPTY);

  const handleAddField  = useCallback((k, v) => setForm((p)     => ({ ...p, [k]: v })), []);
  const handleEditField = useCallback((k, v) => setEditForm((p) => ({ ...p, [k]: v })), []);

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['services'] }), [qc]);

  /* ── Query ──────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['services', search, filterStatus],
    queryFn: () => servicesAPI.getAll({ search, status: filterStatus }).then((r) => r.data.data),
  });

  /* ── Mutations ──────────────────────────────────────────── */
  const createMut = useMutation({
    mutationFn: servicesAPI.create,
    onSuccess: () => { toast.success('Service added'); setAddOpen(false); setForm(EMPTY); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => servicesAPI.update(id, data),
    onSuccess: () => { toast.success('Service updated'); setEditTarget(null); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: servicesAPI.delete,
    onSuccess: () => { toast.success('Service deleted'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const toggleMut = useMutation({
    mutationFn: servicesAPI.toggle,
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  /* ── Open edit ──────────────────────────────────────────── */
  function openEdit(svc) {
    setEditTarget(svc);
    setEditForm({ name: svc.name, description: svc.description || '', category: svc.category || '' });
  }

  const services = data ?? [];
  const active   = services.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your service catalogue — used in AI review and WhatsApp message generation
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      {/* ── Stats row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Services',    value: services.length, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Active',            value: active,          color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive',          value: services.length - active, color: 'text-gray-500', bg: 'bg-gray-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className={cn('p-4 rounded-xl', s.bg)}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterStatus === val
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Service list ────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <Wrench className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No services yet</p>
            <p className="text-sm text-gray-400">Add your services to enable richer AI-generated review and WhatsApp messages.</p>
            <Button size="sm" className="mt-1 gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {services.map((svc) => (
            <Card
              key={svc._id}
              className={cn(
                'transition-all duration-200',
                svc.status === 'inactive' && 'opacity-60',
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Toggle */}
                <button
                  title={svc.status === 'active' ? 'Disable service' : 'Enable service'}
                  onClick={() => toggleMut.mutate(svc._id)}
                  className="shrink-0 transition-colors"
                >
                  {svc.status === 'active' ? (
                    <ToggleRight className="h-7 w-7 text-green-500 hover:text-green-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-gray-300 hover:text-gray-400" />
                  )}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                    {svc.category && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        {svc.category}
                      </span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      svc.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500',
                    )}>
                      {svc.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {svc.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{svc.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    title="Edit service"
                    onClick={() => openEdit(svc)}
                    className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete service"
                    onClick={() => {
                      if (window.confirm(`Delete "${svc.name}"?`)) deleteMut.mutate(svc._id);
                    }}
                    className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add dialog ──────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Service</DialogTitle></DialogHeader>
          <ServiceForm
            values={form}
            onFieldChange={handleAddField}
            onSubmit={() => {
              if (!form.name.trim()) return toast.error('Service name is required');
              createMut.mutate(form);
            }}
            loading={createMut.isPending}
            submitLabel="Add Service"
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ─────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Service</DialogTitle></DialogHeader>
          {editTarget && (
            <ServiceForm
              values={editForm}
              onFieldChange={handleEditField}
              onSubmit={() => {
                if (!editForm.name.trim()) return toast.error('Service name is required');
                updateMut.mutate({ id: editTarget._id, data: editForm });
              }}
              loading={updateMut.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
