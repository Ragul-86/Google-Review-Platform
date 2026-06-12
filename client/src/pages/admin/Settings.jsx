import { useState } from 'react';
import { usersAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Shield, Settings, LogOut, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Section card ────────────────────────────────────────────── */
function Section({ icon: Icon, title, desc, children }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-5 border-b border-gray-100">
          <div className="p-2.5 bg-gray-100 rounded-xl">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900">{title}</p>
            {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
          </div>
        </div>
        <div className="p-5">{children}</div>
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function AdminSettings() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName]   = useState(user?.name || '');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  const initials = (user?.name || user?.email || 'SA')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function saveProfile(e) {
    e.preventDefault();
    setBusyProfile(true);
    try {
      const res = await usersAPI.updateProfile({ name });
      updateUser?.(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally { setBusyProfile(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPw.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPw !== confPw)  return toast.error('Passwords do not match');
    setBusyPw(true);
    try {
      await usersAPI.updateProfile({ newPassword: newPw });
      toast.success('Password updated');
      setNewPw(''); setConfPw('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally { setBusyPw(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile, security, and platform configuration</p>
      </div>

      {/* ── Profile section ──────────────────────────────────────── */}
      <Section icon={User} title="Profile" desc="Update your name and view account details">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-gray-500">Email address</Label>
            <Input value={user?.email || ''} disabled className="mt-1 bg-gray-50 text-gray-500" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-500">Full name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="Your name"
            />
          </div>
          <Button type="submit" disabled={busyProfile} className="mt-1">
            {busyProfile ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Section>

      {/* ── Security section ─────────────────────────────────────── */}
      <Section icon={Shield} title="Security" desc="Change your password to keep your account secure">
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-gray-500">New password</Label>
            <Input
              type="password"
              className="mt-1"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-500">Confirm password</Label>
            <Input
              type="password"
              className={cn('mt-1', confPw && confPw !== newPw ? 'border-red-400' : '')}
              value={confPw}
              onChange={(e) => setConfPw(e.target.value)}
              placeholder="Repeat new password"
            />
            {confPw && confPw !== newPw && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <Button type="submit" disabled={busyPw || !newPw || !confPw} className="mt-1">
            {busyPw ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Section>

      {/* ── Platform section ─────────────────────────────────────── */}
      <Section icon={Settings} title="Platform" desc="Platform-wide configuration and reference info">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Review page URL pattern</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex-1 truncate">
                  {window.location.origin}/review/&lt;business-slug&gt;
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/review/`); toast.success('Copied'); }}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Admin URL</p>
              <code className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg block">
                {window.location.origin}/admin
              </code>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-2"
              onClick={() => toast('Sign out?', {
                description: 'You will be redirected to the login page.',
                action: { label: 'Sign out', onClick: () => logout?.() },
                cancel: { label: 'Cancel', onClick: () => {} },
                duration: 8000,
              })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
