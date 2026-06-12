import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Trash2, ExternalLink, Copy, Pencil, KeyRound,
  AlertCircle, CheckCircle2, MoreVertical, Search,
  Building2, ChevronUp, ChevronDown, Eye, Mail,
  MessageCircle, Star, ShieldCheck, ShieldOff, AtSign,
  Send, Globe, Phone, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/* ── Google URL validation ───────────────────────────────────── */
const GOOGLE_HOSTS = [
  'search.google.com', 'g.page', 'maps.google.com',
  'maps.app.goo.gl', 'www.google.com', 'google.com',
];
function validateGoogleUrl(url) {
  if (!url?.trim()) return { valid: false, reason: 'missing' };
  try {
    const u = new URL(url.trim());
    if (!['https:', 'http:'].includes(u.protocol)) return { valid: false, reason: 'invalid' };
    return GOOGLE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h))
      ? { valid: true } : { valid: false, reason: 'invalid' };
  } catch { return { valid: false, reason: 'invalid' }; }
}

function GoogleUrlField({ value, onChange }) {
  const s = validateGoogleUrl(value);
  return (
    <div>
      <Label>Google Review URL <span className="text-red-500">*</span></Label>
      <Input
        placeholder="https://search.google.com/local/writereview?placeid=..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('mt-1', value ? (s.valid ? 'border-green-400' : 'border-red-400') : '')}
      />
      {value && (
        <p className={cn('mt-1 flex items-center gap-1 text-xs', s.valid ? 'text-green-600' : 'text-red-500')}>
          {s.valid
            ? <><CheckCircle2 className="h-3 w-3" /> Valid Google URL</>
            : <><AlertCircle className="h-3 w-3" /> Must be a Google Review URL</>}
        </p>
      )}
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

/* ── WhatsApp message templates ─────────────────────────────── */
function buildWAMessage(template, client) {
  const loginUrl    = `${window.location.origin}/login`;
  const reviewUrl   = `${window.location.origin}/review/${client?.slug || ''}`;
  const ownerEmail  = client?.ownerId?.email || client?.email || '';
  const bizName     = client?.businessName || '';
  const googleUrl   = client?.googleReviewLink || 'Not configured';

  switch (template) {
    case 'onboarding':
      return `Hi! Welcome to Get Five Star 🌟\n\nYour business account has been set up:\n\n*Business:* ${bizName}\n*Login URL:* ${loginUrl}\n*Username:* ${ownerEmail}\n\nPlease set your password using the link sent separately.\n\n*Your Review Page:* ${reviewUrl}\n*Google Reviews:* ${googleUrl}\n\nNeed help? Reply to this message.`;

    case 'setup_reminder':
      return `Hi ${bizName} team 👋\n\nThis is a reminder that your Get Five Star account setup is pending.\n\n*Login URL:* ${loginUrl}\n*Username:* ${ownerEmail}\n\nPlease complete your profile setup including:\n✅ Business details\n✅ Services & Categories\n✅ Google Review URL\n\nReach out if you need assistance!`;

    case 'approval_reminder':
      return `Hi ${bizName} 🔔\n\nYour account setup is under review. Please ensure:\n\n✅ Google Review URL is configured\n✅ Services are added\n✅ Categories are set\n\nOnce approved, your Review Page will go live:\n${reviewUrl}\n\nContact us if you have questions!`;

    case 'custom':
    default:
      return '';
  }
}

const WA_TEMPLATES = [
  { id: 'onboarding',        label: '📋 Client Onboarding' },
  { id: 'setup_reminder',    label: '🔔 Setup Reminder' },
  { id: 'approval_reminder', label: '✅ Approval Reminder' },
  { id: 'custom',            label: '✏️ Custom Message' },
];

/* ════════════════════════════════════════════════════════════════
   PORTAL-BASED ACTION MENU
   BUG FIX: menuRef added to portal container → included in
   outside-click check → menu stays open until you actually
   click a menu item (not just mousedown anywhere in DOM).
   ════════════════════════════════════════════════════════════════ */
function ActionMenu({ client, onEdit, onResetPassword, onResetLogin, onToggle, onDelete, onMessage }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef          = useRef(null);
  const menuRef         = useRef(null);   // ← KEY FIX

  /* Close on outside click — checks BOTH trigger button AND menu container */
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      const insideBtn  = btnRef.current?.contains(e.target);
      const insideMenu = menuRef.current?.contains(e.target);
      if (!insideBtn && !insideMenu) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Close on scroll */
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  function openMenu(e) {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = 370;
    const menuWidth  = 224;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top  = spaceBelow > menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
    const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
    setPos({ top, left });
    setOpen((v) => !v);
  }

  /* action(fn): close menu first, then run fn in next tick so
     modal state updates don't race with portal unmount           */
  function action(fn) {
    setOpen(false);
    setTimeout(fn, 0);
  }

  const isActive = client.status === 'active';

  const menu = open && createPortal(
    <>
      {/* Backdrop — closes menu when clicking outside */}
      <div className="fixed inset-0 z-[9998]" onMouseDown={() => setOpen(false)} />

      {/* Menu container — ref attached here so outside-click ignores it */}
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl py-1.5 w-[224px] overflow-hidden"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Client header */}
        <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
          <p className="text-xs font-bold text-gray-900 truncate">{client.businessName}</p>
          <p className="text-[11px] text-gray-400 truncate">{client.ownerId?.email ?? 'No owner'}</p>
        </div>

        {/* ── View actions ── */}
        <MenuRow icon={Eye} label="View Review Page" onClick={() => action(() => {
          if (!client.slug) return toast.error('Review page slug not configured');
          window.open(`${window.location.origin}/review/${client.slug}`, '_blank');
          toast.success('Review Page Opened');
        })} />
        <MenuRow icon={Star} label="Open Google Reviews" onClick={() => action(() => {
          const { valid, reason } = validateGoogleUrl(client.googleReviewLink);
          if (!valid) {
            toast.error(reason === 'missing'
              ? 'Google Review URL not configured'
              : 'Invalid Google Review URL');
            return;
          }
          window.open(client.googleReviewLink, '_blank');
          toast.success('Google Reviews Opened');
        })} />
        <MenuRow icon={Globe} label="Copy Review Link" onClick={() => action(() => {
          const url = `${window.location.origin}/review/${client.slug}`;
          navigator.clipboard.writeText(url);
          toast.success('Review Link Copied');
        })} />

        <div className="border-t border-gray-100 my-1" />

        {/* ── Management actions ── */}
        <MenuRow icon={Pencil}        label="Edit Client"   onClick={() => action(onEdit)} />
        <MenuRow icon={MessageCircle} label="Send Message"  onClick={() => action(onMessage)} />

        <div className="border-t border-gray-100 my-1" />

        {/* ── Auth actions ── */}
        <MenuRow icon={KeyRound} label="Reset Password" onClick={() => action(onResetPassword)} />
        <MenuRow icon={AtSign}   label="Reset Login ID" onClick={() => action(onResetLogin)} />

        <div className="border-t border-gray-100 my-1" />

        {/* ── Status + delete ── */}
        <MenuRow
          icon={isActive ? ShieldOff : ShieldCheck}
          label={isActive ? 'Deactivate Account' : 'Activate Account'}
          onClick={() => action(onToggle)}
          color={isActive ? 'amber' : 'green'}
        />
        <MenuRow
          icon={Trash2}
          label="Delete Client"
          onClick={() => action(onDelete)}
          color="red"
        />
      </div>
    </>,
    document.body,
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          open
            ? 'bg-gray-200 text-gray-700'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
        )}
        aria-label="Client actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

function MenuRow({ icon: Icon, label, onClick, color }) {
  const colors = {
    red:   'text-red-600 hover:bg-red-50',
    amber: 'text-amber-600 hover:bg-amber-50',
    green: 'text-green-600 hover:bg-green-50',
  };
  return (
    <button
      onMouseDown={(e) => e.stopPropagation()} /* prevent backdrop from firing */
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
        color ? colors[color] : 'text-gray-700 hover:bg-gray-50',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );
}

/* ── Sort header ─────────────────────────────────────────────── */
function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700"
    >
      {label}
      {active
        ? sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        : <ChevronDown className="h-3 w-3 text-gray-300" />}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════ */
export default function AdminClients() {
  const qc = useQueryClient();

  /* ── Modal states ── */
  const [createOpen,     setCreateOpen]     = useState(false);
  const [editOpen,       setEditOpen]       = useState(false);
  const [editClient,     setEditClient]     = useState(null);
  const [credsOpen,      setCredsOpen]      = useState(false);
  const [creds,          setCreds]          = useState(null);
  const [resetLoginOpen, setRLoginOpen]     = useState(false);
  const [resetLoginClient, setRLoginClient] = useState(null);
  const [newLoginEmail,  setNewLoginEmail]  = useState('');
  const [confirmEmail,   setConfirmEmail]   = useState('');
  const [msgOpen,        setMsgOpen]        = useState(false);
  const [msgClient,      setMsgClient]      = useState(null);
  const [msgTemplate,    setMsgTemplate]    = useState('onboarding');
  const [msgBody,        setMsgBody]        = useState('');
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deleteClient,   setDeleteClient]   = useState(null);
  const [pwdResetOpen,   setPwdResetOpen]   = useState(false);
  const [pwdResetClient, setPwdResetClient] = useState(null);

  /* ── Form states ── */
  const [form,     setForm]     = useState(EMPTY);
  const [editForm, setEditForm] = useState({});

  /* ── Filter / sort ── */
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort,         setSort]         = useState({ field: 'businessName', dir: 'asc' });

  /* ── Query ── */
  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data),
  });

  /* ── Mutations ── */
  const createMut = useMutation({
    mutationFn: (fd) => clientsAPI.create(fd),
    onSuccess: (res) => {
      toast.success('Client created successfully');
      setCreateOpen(false);
      const savedEmail = form.ownerEmail;
      setForm(EMPTY);
      if (res.data.setPasswordUrl || res.data.tempPassword) {
        setCreds({
          email:          savedEmail,
          setPasswordUrl: res.data.setPasswordUrl || null,
          loginUrl:       `${window.location.origin}/login`,
        });
        setCredsOpen(true);
      }
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create client'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''));
      return clientsAPI.update(id, fd);
    },
    onSuccess: () => {
      toast.success('Client Updated Successfully');
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => clientsAPI.delete(id),
    onSuccess: () => {
      toast.success('Client Deleted Successfully');
      setDeleteOpen(false);
      setDeleteClient(null);
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => clientsAPI.toggleStatus(id),
    onSuccess: (res) => {
      const s = res.data.data?.status;
      toast.success(s === 'active' ? 'Client Activated' : 'Client Deactivated');
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: () => toast.error('Failed to change status'),
  });

  const resetPwdMut = useMutation({
    mutationFn: (id) => clientsAPI.resetPassword(id),
    onSuccess: (res) => {
      setPwdResetOpen(false);
      setCreds({
        email:          res.data.email,
        setPasswordUrl: res.data.setPasswordUrl || null,
        loginUrl:       `${window.location.origin}/login`,
      });
      setCredsOpen(true);
      toast.success('Password Reset Link Generated');
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to reset password'),
  });

  const resetLoginMut = useMutation({
    mutationFn: ({ id, newEmail }) => clientsAPI.resetLoginId(id, newEmail),
    onSuccess: () => {
      toast.success('Login ID Updated Successfully');
      setRLoginOpen(false);
      setNewLoginEmail('');
      setConfirmEmail('');
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update Login ID'),
  });

  const messageMut = useMutation({
    mutationFn: ({ id, subject, message }) => clientsAPI.sendMessage(id, { subject, message }),
    onSuccess: () => {
      toast.success('Message Sent Successfully');
      setMsgOpen(false);
      setMsgTemplate('onboarding');
      setMsgBody('');
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to send message'),
  });

  /* ── Handlers ── */
  function handleCreate() {
    if (!form.businessName?.trim()) return toast.error('Business name is required');
    if (!form.ownerEmail?.trim())   return toast.error('Owner email is required');
    const { valid, reason } = validateGoogleUrl(form.googleReviewLink);
    if (!valid) {
      toast.error(reason === 'missing' ? 'Google Review URL is required' : 'Invalid Google Review URL');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    createMut.mutate(fd);
  }

  function openEdit(client) {
    setEditClient(client);
    setEditForm({
      businessName:     client.businessName,
      businessCategory: client.businessCategory,
      googleReviewLink: client.googleReviewLink || '',
      address:          client.address || '',
      phone:            client.phone || '',
      email:            client.email || '',
      businessLogo:     client.businessLogo || '',
    });
    setEditOpen(true);
  }

  function handleEdit() {
    const { valid, reason } = validateGoogleUrl(editForm.googleReviewLink);
    if (!valid) {
      toast.error(reason === 'missing' ? 'Google Review URL is required' : 'Invalid Google Review URL');
      return;
    }
    editMut.mutate({ id: editClient._id, data: editForm });
  }

  function openResetLogin(client) {
    setRLoginClient(client);
    setNewLoginEmail('');
    setConfirmEmail('');
    setRLoginOpen(true);
  }

  function handleResetLogin() {
    if (!newLoginEmail.trim()) return toast.error('New email is required');
    if (newLoginEmail !== confirmEmail) return toast.error('Emails do not match');
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(newLoginEmail)) return toast.error('Enter a valid email address');
    resetLoginMut.mutate({ id: resetLoginClient._id, newEmail: newLoginEmail });
  }

  function openMessage(client) {
    setMsgClient(client);
    setMsgTemplate('onboarding');
    setMsgBody(buildWAMessage('onboarding', client));
    setMsgOpen(true);
  }

  function openDelete(client) {
    setDeleteClient(client);
    setDeleteOpen(true);
  }

  function openPwdReset(client) {
    setPwdResetClient(client);
    setPwdResetOpen(true);
  }

  function sendViaWhatsApp() {
    if (!msgBody.trim()) return toast.error('Message cannot be empty');
    const phone = msgClient?.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgBody)}`, '_blank');
      toast.success('WhatsApp Opened');
    } else {
      navigator.clipboard.writeText(msgBody);
      toast.success('Message Copied — No phone on file. Paste into WhatsApp manually.');
    }
  }

  function toggleSort(field) {
    setSort((s) => s.field === field
      ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' });
  }

  /* ── Filter + sort ── */
  const allClients = data?.data ?? [];
  const activeCount   = allClients.filter((c) => c.status === 'active').length;
  const inactiveCount = allClients.length - activeCount;

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
      if      (sort.field === 'businessName') { av = a.businessName || ''; bv = b.businessName || ''; }
      else if (sort.field === 'category')     { av = a.businessCategory || ''; bv = b.businessCategory || ''; }
      else if (sort.field === 'status')       { av = a.status || ''; bv = b.status || ''; }
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {allClients.length} total · {activeCount} active · {inactiveCount} inactive
          </p>
        </div>

        {/* Create client dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Client</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto z-[9999]">
            <DialogHeader><DialogTitle>Create Client &amp; Owner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Business Name <span className="text-red-500">*</span></Label>
                <Input className="mt-1" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </div>
              <div>
                <Label>Business Type</Label>
                <Select value={form.businessCategory} onValueChange={(v) => setForm({ ...form, businessCategory: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <GoogleUrlField value={form.googleReviewLink} onChange={(v) => setForm({ ...form, googleReviewLink: v })} />
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Business Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input className="mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Logo URL</Label><Input className="mt-1" type="url" placeholder="https://…" value={form.businessLogo} onChange={(e) => setForm({ ...form, businessLogo: e.target.value })} /></div>
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-gray-700 mb-2">Owner Login Account</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Full Name</Label><Input className="mt-1" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
                  <div><Label>Email (Login ID) <span className="text-red-500">*</span></Label><Input className="mt-1" type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating…' : 'Create Client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Edit Client dialog ───────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader><DialogTitle>Edit Client — {editClient?.businessName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Business Name</Label>
              <Input className="mt-1" value={editForm.businessName || ''} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} />
            </div>
            <div>
              <Label>Business Type</Label>
              <Select value={editForm.businessCategory || ''} onValueChange={(v) => setEditForm({ ...editForm, businessCategory: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[9999]">
                  {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <GoogleUrlField value={editForm.googleReviewLink || ''} onChange={(v) => setEditForm({ ...editForm, googleReviewLink: v })} />
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Phone</Label><Input className="mt-1" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div><Label>Business Email</Label><Input className="mt-1" type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Input className="mt-1" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
            <div><Label>Logo URL</Label><Input className="mt-1" type="url" placeholder="https://…" value={editForm.businessLogo || ''} onChange={(e) => setEditForm({ ...editForm, businessLogo: e.target.value })} /></div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleEdit} disabled={editMut.isPending}>
                {editMut.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Credentials modal ────────────────────────────────────── */}
      <Dialog open={credsOpen} onOpenChange={(o) => { if (!o) { setCredsOpen(false); setCreds(null); } }}>
        <DialogContent className="z-[9999] max-w-lg">
          <DialogHeader><DialogTitle>Client Setup Credentials</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 mb-3">
            Share these with the client via WhatsApp. Set-password link expires in 48 hours.
          </p>
          <div className="space-y-3 text-sm bg-gray-50 border border-gray-100 p-4 rounded-xl">
            <CredRow label="Login Email (Username)" value={creds?.email} />
            <CredRow label="Login URL" value={creds?.loginUrl} />
            {creds?.setPasswordUrl && (
              <CredRow label="Set Password Link (48h)" value={creds.setPasswordUrl} mono blue />
            )}
          </div>
          <Button
            className="w-full mt-2 gap-2"
            onClick={() => {
              const msg = [
                `Login URL: ${creds?.loginUrl}`,
                `Username: ${creds?.email}`,
                creds?.setPasswordUrl ? `Set Password: ${creds.setPasswordUrl}` : '',
              ].filter(Boolean).join('\n');
              navigator.clipboard.writeText(msg);
              toast.success('All credentials copied');
            }}
          >
            <Copy className="h-4 w-4" /> Copy All for WhatsApp
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password confirmation dialog ───────────────────── */}
      <Dialog open={pwdResetOpen} onOpenChange={setPwdResetOpen}>
        <DialogContent className="z-[9999] max-w-sm">
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
              <RefreshCw className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                This generates a new <strong>Set Password link</strong> (valid 48h) for{' '}
                <strong>{pwdResetClient?.businessName}</strong>. Share it with the client via WhatsApp.
              </p>
            </div>
            <p className="text-sm text-gray-500">Owner: <strong>{pwdResetClient?.ownerId?.email}</strong></p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPwdResetOpen(false)}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={() => resetPwdMut.mutate(pwdResetClient._id)}
              disabled={resetPwdMut.isPending}
            >
              {resetPwdMut.isPending ? 'Generating…' : 'Generate Reset Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reset Login ID modal ─────────────────────────────────── */}
      <Dialog open={resetLoginOpen} onOpenChange={setRLoginOpen}>
        <DialogContent className="z-[9999]">
          <DialogHeader><DialogTitle>Reset Login ID — {resetLoginClient?.businessName}</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500 mb-3">
            Current login: <strong>{resetLoginClient?.ownerId?.email}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <Label>New Login Email <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                type="email"
                value={newLoginEmail}
                onChange={(e) => setNewLoginEmail(e.target.value)}
                placeholder="new@email.com"
              />
            </div>
            <div>
              <Label>Confirm New Email <span className="text-red-500">*</span></Label>
              <Input
                className={cn('mt-1', confirmEmail && confirmEmail !== newLoginEmail ? 'border-red-400' : '')}
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirm email"
              />
              {confirmEmail && confirmEmail !== newLoginEmail && (
                <p className="text-xs text-red-500 mt-1">Emails do not match</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setRLoginOpen(false)}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={handleResetLogin}
              disabled={resetLoginMut.isPending || !newLoginEmail.trim() || newLoginEmail !== confirmEmail}
            >
              {resetLoginMut.isPending ? 'Updating…' : 'Update Login ID'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Send Message modal ───────────────────────────────────── */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="z-[9999] max-w-lg">
          <DialogHeader><DialogTitle>Send Message — {msgClient?.businessName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {/* WhatsApp badge */}
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-medium">
              <MessageCircle className="h-4 w-4 shrink-0" />
              WhatsApp — V1 Only
              {msgClient?.phone && (
                <span className="ml-auto text-[11px] text-green-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" />{msgClient.phone}
                </span>
              )}
            </div>

            {/* Template selector */}
            <div>
              <Label>Message Template</Label>
              <Select
                value={msgTemplate}
                onValueChange={(v) => {
                  setMsgTemplate(v);
                  setMsgBody(buildWAMessage(v, msgClient));
                }}
              >
                <SelectTrigger className="mt-1 z-[9999]"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[9999]">
                  {WA_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Message body */}
            <div>
              <Label>Message</Label>
              <textarea
                className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-gray-200 min-h-[160px] font-mono"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Type or select a template…"
              />
            </div>

            {/* No phone warning */}
            {!msgClient?.phone && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                No phone on file — message will be copied to clipboard for manual WhatsApp.
              </div>
            )}

            <div className="flex gap-2">
              {/* Copy message */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { navigator.clipboard.writeText(msgBody); toast.success('Message Copied'); }}
                disabled={!msgBody.trim()}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>

              {/* Open WhatsApp */}
              <Button
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                onClick={sendViaWhatsApp}
                disabled={!msgBody.trim()}
              >
                <MessageCircle className="h-4 w-4" />
                {msgClient?.phone ? 'Open WhatsApp' : 'Copy & Open WhatsApp'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation Dialog ───────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="z-[9999] max-w-sm">
          <DialogHeader><DialogTitle className="text-red-600">Delete Client?</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">
                This will permanently delete <strong>{deleteClient?.businessName}</strong> and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteMut.mutate(deleteClient._id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
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
          {['all', 'active', 'inactive'].map((s) => (
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
      <Card className="border-0 shadow-sm overflow-visible">
        <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_44px] items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <SortHeader label="Business Name" field="businessName" sort={sort} onSort={toggleSort} />
          <SortHeader label="Category"      field="category"     sort={sort} onSort={toggleSort} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</span>
          <SortHeader label="Status"        field="status"       sort={sort} onSort={toggleSort} />
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
                className="grid md:grid-cols-[2fr_2fr_1fr_1fr_44px] items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                {/* Business name + logo */}
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
                    b.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
                  )}>
                    {b.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Action menu */}
                <ActionMenu
                  client={b}
                  onEdit={() => openEdit(b)}
                  onToggle={() => toggleMut.mutate(b._id)}
                  onMessage={() => openMessage(b)}
                  onResetPassword={() => openPwdReset(b)}
                  onResetLogin={() => openResetLogin(b)}
                  onDelete={() => openDelete(b)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Small helper: credential row with copy button ───────────── */
function CredRow({ label, value, mono, blue }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={cn(
          'break-all',
          mono ? 'font-mono text-xs' : 'font-bold text-gray-900',
          blue ? 'text-blue-600' : '',
        )}>
          {value || '—'}
        </p>
      </div>
      <button
        className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        onClick={() => { navigator.clipboard.writeText(value || ''); toast.success('Copied'); }}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
