import { useState } from 'react';
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
import { Plus, Trash2, ExternalLink, Copy, Pencil, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

/* ── Google Review URL validation ─────────────────────────────── */
const GOOGLE_HOSTS = [
  'search.google.com', 'g.page', 'maps.google.com',
  'maps.app.goo.gl', 'www.google.com', 'google.com',
];
function validateGoogleUrl(url) {
  if (!url?.trim()) return { valid: false, reason: 'missing' };
  try {
    const u = new URL(url.trim());
    if (!['https:', 'http:'].includes(u.protocol)) return { valid: false, reason: 'invalid' };
    const ok = GOOGLE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
    return ok ? { valid: true } : { valid: false, reason: 'invalid' };
  } catch { return { valid: false, reason: 'invalid' }; }
}
function GoogleUrlField({ value, onChange, label = 'Google Review URL *' }) {
  const status = validateGoogleUrl(value);
  return (
    <div>
      <Label>{label}</Label>
      <Input
        placeholder="https://search.google.com/local/writereview?placeid=..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={value ? (status.valid ? 'border-green-400' : 'border-red-400') : ''}
      />
      {value && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${status.valid ? 'text-green-600' : 'text-red-500'}`}>
          {status.valid
            ? <><CheckCircle2 className="h-3 w-3" /> Valid</>
            : <><AlertCircle className="h-3 w-3" /> Invalid — must be a Google Review URL</>}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-0.5">
        Accepted: search.google.com · g.page · maps.google.com
      </p>
    </div>
  );
}

const BUSINESS_TYPES = [
  'Beauty Salon / Nail Studio', 'Digital Marketing Agency', 'Mobile / Laptop Service Center',
  'Hospital / Clinic', 'Training Institute / Coaching Center', 'Gym / Fitness Center',
  'Clothing & Apparel Business', 'Electronics Store', 'Furniture Business',
  'Grocery / Supermarket', 'Bakery / Food Products', 'Manufacturing Company (B2B)',
  'E-commerce Store', 'Restaurant', 'Clinic', 'Salon', 'Hotel', 'Retail', 'Other',
];

const EMPTY = {
  businessName: '', businessCategory: BUSINESS_TYPES[0], googleReviewLink: '',
  address: '', phone: '', email: '', website: '', businessLogo: '',
  ownerName: '', ownerEmail: '', subscriptionPlan: 'free',
};

export default function AdminClients() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editForm, setEditForm] = useState({});
  const [creds, setCreds] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (fd) => clientsAPI.create(fd),
    onSuccess: (res) => {
      toast.success('Business created');
      setOpen(false);
      const savedEmail = form.ownerEmail;
      setForm(EMPTY);
      if (res.data.tempPassword) {
        setCreds({ email: savedEmail, password: res.data.tempPassword });
      }
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
    onSuccess: () => {
      toast.success('Client updated');
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => clientsAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['clients'] }); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => clientsAPI.toggleStatus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const resetPwdMut = useMutation({
    mutationFn: (id) => clientsAPI.resetPassword(id),
    onSuccess: (res) => {
      setCreds({ email: res.data.email, password: res.data.tempPassword });
      toast.success('Password reset');
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to reset'),
  });

  function handleCreate() {
    if (!form.businessName?.trim()) return toast.error('Business name is required');
    if (!form.ownerEmail?.trim()) return toast.error('Owner email is required');
    const { valid, reason } = validateGoogleUrl(form.googleReviewLink);
    if (!valid) {
      toast.error(
        reason === 'missing'
          ? 'Google Review URL is required'
          : 'Invalid Google Review URL. Accepted: search.google.com, g.page, maps.google.com',
      );
      return;
    }
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
    });
    setEditOpen(true);
  }

  function handleEdit() {
    const { valid, reason } = validateGoogleUrl(editForm.googleReviewLink);
    if (!valid) {
      toast.error(
        reason === 'missing'
          ? 'Google Review URL is required'
          : 'Invalid Google Review URL. Accepted: search.google.com, g.page, maps.google.com',
      );
      return;
    }
    editMut.mutate({ id: editClient._id, data: editForm });
  }

  const clients = (data?.data ?? []).filter((c) =>
    !search || c.businessName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Client</Button>
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
              <GoogleUrlField
                value={form.googleReviewLink}
                onChange={(v) => setForm({ ...form, googleReviewLink: v })}
              />
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Business email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Logo URL</Label><Input type="url" placeholder="https://example.com/logo.png" value={form.businessLogo} onChange={(e) => setForm({ ...form, businessLogo: e.target.value })} /></div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Business owner login</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Owner name</Label><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
                  <div><Label>Owner email</Label><Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating…' : 'Create'}
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
            <div><Label>Business name</Label><Input value={editForm.businessName || ''} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={editForm.businessCategory || ''} onValueChange={(v) => setEditForm({ ...editForm, businessCategory: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <GoogleUrlField
              value={editForm.googleReviewLink || ''}
              onChange={(v) => setEditForm({ ...editForm, googleReviewLink: v })}
            />
            <div><Label>Address</Label><Input value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><Label>Business email</Label><Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div><Label>Logo URL</Label><Input type="url" placeholder="https://example.com/logo.png" value={editForm.businessLogo || ''} onChange={(e) => setEditForm({ ...editForm, businessLogo: e.target.value })} /></div>
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
          <p className="text-sm text-muted-foreground">Save these now — the password won't be shown again.</p>
          <div className="space-y-2 font-mono text-sm bg-muted p-3 rounded">
            <div className="flex items-center justify-between gap-2">
              <span>Email: {creds?.email}</span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(creds?.email ?? ''); toast.success('Copied'); }}><Copy className="h-3 w-3" /></Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Password: {creds?.password}</span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(creds?.password ?? ''); toast.success('Copied'); }}><Copy className="h-3 w-3" /></Button>
            </div>
          </div>
          <Button onClick={() => { navigator.clipboard.writeText(`Email: ${creds?.email}\nPassword: ${creds?.password}`); toast.success('Copied all'); }}>Copy all</Button>
        </DialogContent>
      </Dialog>

      <Input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="grid gap-3">
          {clients.map((b) => {
            const reviewUrl = `${window.location.origin}/review/${b.slug}`;
            return (
              <Card key={b._id}>
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{b.businessName}</p>
                      {b.status !== 'active' && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">{b.status}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{b.businessCategory} · Owner: {b.ownerId?.email ?? '—'}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(reviewUrl); toast.success('Link copied'); }}
                      className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1 truncate hover:underline"
                    >
                      <Copy className="h-3 w-3 shrink-0" /> {reviewUrl}
                    </button>
                  </div>
                  <TooltipProvider delayDuration={200}>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={b.status === 'active'}
                        onCheckedChange={() => toggleMut.mutate(b._id)}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(reviewUrl); toast.success('Link copied'); }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy link</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Open review page</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => { if (window.confirm(`Reset password for ${b.businessName}?`)) resetPwdMut.mutate(b._id); }}
                            disabled={resetPwdMut.isPending}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset password</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit client</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => { if (window.confirm('Delete this business and all its data?')) deleteMut.mutate(b._id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>
            );
          })}
          {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients yet.</p>}
        </div>
      )}
    </div>
  );
}
