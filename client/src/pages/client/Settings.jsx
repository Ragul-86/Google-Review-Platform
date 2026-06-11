import { useState } from 'react';
import { clientsAPI, usersAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import WhatsAppTemplates from '@/components/WhatsAppTemplates';

/* ── Google Review URL validation ────────────────────────────────
   Accepted:
     https://search.google.com/local/writereview?placeid=...
     https://g.page/r/...../review
     https://maps.google.com/...
     https://maps.app.goo.gl/...
     https://www.google.com/maps/...
─────────────────────────────────────────────────────────────── */
const GOOGLE_HOSTS = [
  'search.google.com',
  'g.page',
  'maps.google.com',
  'maps.app.goo.gl',
  'www.google.com',
  'google.com',
];

function validateGoogleUrl(url) {
  if (!url?.trim()) return { valid: false, reason: 'missing' };
  try {
    const u = new URL(url.trim());
    if (!['https:', 'http:'].includes(u.protocol)) return { valid: false, reason: 'invalid' };
    const ok = GOOGLE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
    return ok ? { valid: true } : { valid: false, reason: 'invalid' };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

const TABS = ['Business Profile', 'Google Review URL', 'Business Logo', 'Category Settings', 'WhatsApp Templates'];

export default function ClientSettings() {
  const { user, updateUser } = useAuth();
  const client = user?.client;
  const reviewLink = `${window.location.origin}/review/${client?.slug}`;

  const [tab, setTab] = useState('Business Profile');
  const [form, setForm] = useState({
    businessName:     client?.businessName     || '',
    address:          client?.address          || '',
    googleReviewLink: client?.googleReviewLink || '',
    businessLogo:     client?.businessLogo     || '',
  });
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd]   = useState('');

  /* ── URL status for Google Review URL tab ─────────────────── */
  const urlStatus = validateGoogleUrl(form.googleReviewLink);

  async function saveBusinessProfile() {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      const res = await clientsAPI.updateMe(fd);
      updateUser?.({ client: res.data.data });
      toast.success('Saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function saveGoogleUrl() {
    const url = form.googleReviewLink?.trim();
    const { valid, reason } = validateGoogleUrl(url);
    if (!valid) {
      toast.error(
        reason === 'missing'
          ? 'Please enter your Google Review URL before saving.'
          : 'Invalid Google Review URL. Accepted formats: search.google.com, g.page, maps.google.com',
      );
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('googleReviewLink', url);
      const res = await clientsAPI.updateMe(fd);
      updateUser?.({ client: res.data.data });
      toast.success('Google Review URL saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  }

  function testGoogleUrl() {
    const url = form.googleReviewLink?.trim();
    const { valid, reason } = validateGoogleUrl(url);
    if (!valid) {
      toast.error(
        reason === 'missing'
          ? 'Google Review URL is not configured.'
          : 'Invalid Google Review URL. Please check the format.',
      );
      return;
    }
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      toast.error('Popup blocked. Please allow popups and try again.');
    } else {
      toast.success('Opened Google Review page in a new tab.');
    }
  }

  async function saveField(field) {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append(field, form[field] ?? '');
      const res = await clientsAPI.updateMe(fd);
      updateUser?.({ client: res.data.data });
      toast.success('Saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!newPwd || newPwd.length < 6) return toast.error('Min 6 characters');
    setSaving(true);
    try {
      await usersAPI.updateProfile({ currentPassword: currPwd, newPassword: newPwd });
      toast.success('Password updated');
      setCurrPwd(''); setNewPwd('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Business profile, Google review URL, logo, and categories</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border rounded-lg p-1 w-fit bg-muted flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Business Profile ──────────────────────────────── */}
      {tab === 'Business Profile' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            {client?.slug && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                🔗 Your review link:{' '}
                <a href={reviewLink} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate">
                  {reviewLink}
                </a>
              </p>
            )}
            <div>
              <Label>Business name *</Label>
              <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Google Review URL *</Label>
              <Input
                type="url"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={form.googleReviewLink}
                onChange={(e) => setForm({ ...form, googleReviewLink: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Accepted: search.google.com · g.page · maps.google.com
              </p>
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input type="url" placeholder="https://example.com/logo.png" value={form.businessLogo} onChange={(e) => setForm({ ...form, businessLogo: e.target.value })} />
            </div>
            <Button onClick={saveBusinessProfile} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Google Review URL ─────────────────────────────── */}
      {tab === 'Google Review URL' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Customers who rate 4–5 stars are redirected to this URL to leave a Google review.
              The URL must be valid before saving.
            </p>

            <div>
              <Label>Google Review URL *</Label>
              <Input
                type="url"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={form.googleReviewLink}
                onChange={(e) => setForm({ ...form, googleReviewLink: e.target.value })}
                className={
                  form.googleReviewLink
                    ? urlStatus.valid
                      ? 'border-green-400 focus-visible:ring-green-400'
                      : 'border-red-400 focus-visible:ring-red-400'
                    : ''
                }
              />

              {/* Inline status indicator */}
              {form.googleReviewLink && (
                <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${urlStatus.valid ? 'text-green-600' : 'text-red-500'}`}>
                  {urlStatus.valid
                    ? <><CheckCircle2 className="h-3.5 w-3.5" /> Valid Google Review URL</>
                    : <><AlertCircle className="h-3.5 w-3.5" /> Invalid URL — must be a Google Review link</>
                  }
                </div>
              )}

              {/* Accepted formats hint */}
              <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Accepted formats:</p>
                <p className="font-mono">https://search.google.com/local/writereview?placeid=…</p>
                <p className="font-mono">https://g.page/r/…/review</p>
                <p className="font-mono">https://maps.google.com/…</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={testGoogleUrl}
                className="gap-2"
                disabled={!form.googleReviewLink}
              >
                <ExternalLink className="h-4 w-4" />
                Test Google Review URL
              </Button>
              <Button onClick={saveGoogleUrl} disabled={saving} className="gap-2">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save URL'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Business Logo ─────────────────────────────────── */}
      {tab === 'Business Logo' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Enter a URL for your business logo. It will appear on the review page and in the client header.</p>
            {form.businessLogo && (
              <img src={form.businessLogo} alt="Logo preview" className="h-20 w-20 rounded-full object-cover border" />
            )}
            <div>
              <Label>Logo URL</Label>
              <Input type="url" placeholder="https://example.com/logo.png" value={form.businessLogo} onChange={(e) => setForm({ ...form, businessLogo: e.target.value })} />
            </div>
            <Button onClick={() => saveField('businessLogo')} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Category Settings ─────────────────────────────── */}
      {tab === 'Category Settings' && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Manage categories from the <strong>Categories</strong> page in the sidebar. You can enable/disable and add custom categories there.</p>
            <hr />
            <p className="font-medium text-sm">Change Password</p>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <Label>Current password</Label>
                <Input type="password" value={currPwd} onChange={(e) => setCurrPwd(e.target.value)} />
              </div>
              <div>
                <Label>New password</Label>
                <Input type="password" minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <Button type="submit" disabled={saving || !newPwd}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</> : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── WhatsApp Templates ────────────────────────────── */}
      {tab === 'WhatsApp Templates' && <WhatsAppTemplates />}
    </div>
  );
}
