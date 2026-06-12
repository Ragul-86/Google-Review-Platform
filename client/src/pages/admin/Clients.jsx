import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Trash2, ExternalLink, Copy, Pencil, KeyRound,
  AlertCircle, CheckCircle2, MoreVertical, Search,
  Building2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Google URL validation ───────────────────────────────────── */
const GOOGLE_HOSTS = ['search.google.com','g.page','maps.google.com','maps.app.goo.gl','www.google.com','google.com'];
function validateGoogleUrl(url) {
  if (!url?.trim()) return { valid: false, reason: 'missing' };
  try {
    const u = new URL(url.trim());
    if (!['https:','http:'].includes(u.protocol)) return { valid: false, reason: 'invalid' };
    return GOOGLE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.'+h))
      ? { valid: true } : { valid: false, reason: 'invalid' };
  } catch { return { valid: false, reason: 'invalid' }; }
}
function GoogleUrlField({ value, onChange }) {
  const s = validateGoogleUrl(value);
  return (
    <div>
      <Label>Google Review URL *</Label>
      <Input
        placeholder="https://search.google.com/local/writereview?placeid=..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={value ? (s.valid ? 'border-green-400' : 'border-red-400') : ''}
      />
      {value && (
        <p className={cn('mt-1 flex items-center gap-1 text-xs', s.valid ? 'text-green-600' : 'text-red-500')}>
          {s.valid
            ? <><CheckCircle2 className="h-3 w-3" /> Valid</>
            : <><AlertCircle className="h-3 w-3" /> Must be a Google Review URL</>}
        </p>
      )}
    </div>
  );
}

const BUSINESS_TYPES = [
  'Beauty Salon / Nail Studio','Digital Marketing Agency','Mobile / Laptop Service Center',
  'Hospital / Clinic','Training Institute / Coaching Center','Gym / Fitness Center',
  'Clothing & Apparel Business','Electronics Store','Furniture Business',
  'Grocery / Supermarket','Bakery / Food Products','Manufacturing Company (B2B)',
  'E-commerce Store','Restaurant','Clinic','Salon','Hotel','Retail','Other',
];

const EMPTY = {
  businessName:'',businessCategory:BUSINESS_TYPES[0],googleReviewLink:'',
  address:'',phone:'',email:'',website:'',businessLogo:'',
  ownerName:'',ownerEmail:'',subscriptionPlan:'free',
};

/* ── Row action menu ─────────────────────────────────────────── */
function ActionMenu({ client, onEdit, onReset, onDelete, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function action(fn) { setOpen(false); fn(); }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-[170px]">
            <button
              onClick={() => action(onEdit)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-400" /> Edit details
            </button>
            <button
              onClick={() => action(() => {
                const url = `${window.location.origin}/review/${client.slug}`;
                navigator.clipboard.writeText(url);
                toast.success('Review link copied');
              })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-3.5 w-3.5 text-gray-400" /> Copy review link
            </button>
            <a
              href={`${window.location.origin}/review/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" /> Open review page
            </a>
            <button
              onClick={() => action(onToggle)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Switch checked={client.status === 'active'} className="scale-75 pointer-events-none" />
              {client.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => action(onReset)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <KeyRound className="h-3.5 w-3.5 text-gray-400" /> Reset password
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => action(onDelete)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete client
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sort header ─────────────────────────────────────────────── */
function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
    >
      {label}
      {active
        ? sort.dir === 'asc'
          ? <ChevronUp className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3" />
        : <ChevronDown className="h-3 w-3 text-gray-300" />}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function AdminClients() {
  const qc = useQueryClient();
  const [open, setOpen]         = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [editForm, setEditForm] = useState({});
  const [creds, setCreds]       = useState(null);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort]         = useState({ field: 'businessName', dir: 'asc' });

  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (fd) => clientsAPI.create(fd),
    onSuccess: (res) => {
      toast.success('Client created');
      setOpen(false);
      const savedEmail = form.ownerEmail;
      setForm(EMPTY);
      if (res.data.tempPassword) setCreds({ email: savedEmail, password: res.data.tempPassword });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''));
      return clientsAPI.update(id, fd);
    },
    onSuccess: () => { toast.success('Client updated'); setEditOpen(false); qc.invalidateQueries({ queryKey: ['clients'] }); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const deleteMut  = useMutation({
    mutationFn: (id) => clientsAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['clients'] }); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const toggleMut  = useMutation({
    mutationFn: (id) => clientsAPI.toggleStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const resetPwdMut = useMutation({
    mutationFn: (id) => clientsAPI.resetPassword(id),
    onSuccess: (res) => { setCreds({ email: res.data.email, password: res.data.tempPassword }); toast.success('Password reset'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function handleCreate() {
    if (!form.businessName?.trim()) return toast.error('Business name required');
    if (!form.ownerEmail?.trim())   return toast.error('Owner email required');
    const { valid, reason } = validateGoogleUrl(form.googleReviewLink);
    if (!valid) { toast.error(reason === 'missing' ? 'Google Review URL required' : 'Invalid Google Review URL'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    createMut.mutate(fd);
  }

  function openEdit(client) {
    setEditClient(client);
    setEditForm({
      businessName: client.businessName,
      businessCategory: client.businessCategory,
      googleReviewLink: client.googleReviewLink || '',
      address: client.address || '',
      phone: client.phone || '',
      email: client.email || '',
      businessLogo: client.businessLogo || '',
    });
    setEditOpen(true);
  }

  function handleEdit() {
    const { valid, reason } = validateGoogleUrl(editForm.googleReviewLink);
    if (!valid) { toast.error(reason === 'missing' ? 'Google Review URL required' : 'Invalid Google Review URL'); return; }
    editMut.mutate({ id: editClient._id, data: editForm });
  }

  function toggleSort(field) {
    setSort((s) => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  }

  /* Filter + sort */
  const allClients = data?.data ?? [];
  const active   = allClients.filter((c) => c.status === 'active').length;
  const inactive = allClients.length - active;

  const filtered = allClients
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        c.businessName.toLowerCase().includes(q) ||
        (c.businessCategory || '').toLowerCase().includes(q) ||
        (c.ownerId?.email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let av = '', bv = '';
      if (sort.field === 'businessName') { av = a.businessName || ''; bv = b.businessName || ''; }
      else if (sort.field === 'category') { av = a.businessCategory || ''; bv = b.businessCategory || ''; }
      else if (sort.field === 'status') { av = a.status || ''; bv = b.status || ''; }
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {allClients.length} total · {active} active · {inactive} inactive
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Client</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create client &amp; owner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Business name</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.businessCategory} onValueChange={(v) => setForm({ ...form, businessCategory: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <GoogleUrlField value={form.googleReviewLink} onChange={(v) => setForm({ ...form, googleReviewLink: v })} />
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Business email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Logo URL</Label><Input type="url" placeholder="https://..." value={form.businessLogo} onChange={(e) => setForm({ ...form, businessLogo: e.target.value })} /></div>
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-gray-700 mb-2">Owner login</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Name</Label><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating…' : 'Create client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Business name</Label><Input value={editForm.businessName||''} onChange={(e) => setEditForm({...editForm,businessName:e.target.value})} /></div>
            <div>
              <Label>Type</Label>
              <Select value={editForm.businessCategory||''} onValueChange={(v) => setEditForm({...editForm,businessCategory:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <GoogleUrlField value={editForm.googleReviewLink||''} onChange={(v) => setEditForm({...editForm,googleReviewLink:v})} />
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Phone</Label><Input value={editForm.phone||''} onChange={(e) => setEditForm({...editForm,phone:e.target.value})} /></div>
              <div><Label>Business email</Label><Input type="email" value={editForm.email||''} onChange={(e) => setEditForm({...editForm,email:e.target.value})} /></div>
            </div>
            <div><Label>Address</Label><Input value={editForm.address||''} onChange={(e) => setEditForm({...editForm,address:e.target.value})} /></div>
            <div><Label>Logo URL</Label><Input type="url" placeholder="https://..." value={editForm.businessLogo||''} onChange={(e) => setEditForm({...editForm,businessLogo:e.target.value})} /></div>
            <Button className="w-full" onClick={handleEdit} disabled={editMut.isPending}>
              {editMut.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials modal */}
      <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Owner credentials</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Save these — the password won't be shown again.</p>
          <div className="space-y-2 font-mono text-sm bg-gray-50 border border-gray-100 p-4 rounded-xl">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-700">Email: <strong>{creds?.email}</strong></span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(creds?.email??''); toast.success('Copied'); }}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-700">Password: <strong>{creds?.password}</strong></span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(creds?.password??''); toast.success('Copied'); }}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <Button onClick={() => { navigator.clipboard.writeText(`Email: ${creds?.email}\nPassword: ${creds?.password}`); toast.success('Copied all'); }}>
            Copy all
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Filter bar ───────────────────────────────────────────── */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 h-10"
            placeholder="Search clients, category, owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {['all','active','inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize',
                statusFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_40px] items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <SortHeader label="Business Name" field="businessName" sort={sort} onSort={toggleSort} />
          <SortHeader label="Category" field="category" sort={sort} onSort={toggleSort} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</span>
          <SortHeader label="Status" field="status" sort={sort} onSort={toggleSort} />
          <span />
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {search || statusFilter !== 'all' ? 'No clients match your filters' : 'No clients yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="grid md:grid-cols-[2fr_2fr_1fr_1fr_40px] items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                {/* Business name */}
                <div className="flex items-center gap-3 min-w-0">
                  {b.businessLogo ? (
                    <img src={b.businessLogo} alt="" className="h-8 w-8 rounded-lg object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.businessName}</p>
                    <p className="text-[11px] text-gray-400 truncate">/review/{b.slug}</p>
                  </div>
                </div>

                {/* Category */}
                <p className="text-sm text-gray-600 truncate">{b.businessCategory || '—'}</p>

                {/* Owner */}
                <p className="text-sm text-gray-500 truncate">{b.ownerId?.email ?? '—'}</p>

                {/* Status */}
                <div>
                  <span className={cn(
                    'text-[11px] font-bold px-2.5 py-1 rounded-full',
                    b.status === 'active'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500',
                  )}>
                    {b.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Action menu */}
                <ActionMenu
                  client={b}
                  onEdit={() => openEdit(b)}
                  onToggle={() => toggleMut.mutate(b._id)}
                  onReset={() => toast(`Reset password for ${b.businessName}?`, {
                    description: 'A new temporary password will be generated.',
                    action: { label: 'Yes, Reset', onClick: () => resetPwdMut.mutate(b._id) },
                    cancel: { label: 'Cancel', onClick: () => {} },
                    duration: 8000,
                  })}
                  onDelete={() => toast(`Delete "${b.businessName}"?`, {
                    description: 'This permanently deletes the business and all data.',
                    action: { label: 'Yes, Delete', onClick: () => deleteMut.mutate(b._id) },
                    cancel: { label: 'Cancel', onClick: () => {} },
                    duration: 8000,
                  })}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
