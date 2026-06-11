import { useState } from 'react';
import { usersAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [newPw, setNewPw] = useState('');
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

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
    setBusyPw(true);
    try {
      await usersAPI.updateProfile({ newPassword: newPw });
      toast.success('Password updated');
      setNewPw('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally { setBusyPw(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" subtitle="Profile, security, and platform settings" />

      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div>
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit" disabled={busyProfile}>
              {busyProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <Button type="submit" disabled={busyPw || !newPw}>
              {busyPw ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Platform</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Customer funnel base URL: <code className="text-xs bg-muted px-1 rounded">/review/&lt;slug&gt;</code></p>
          <Button variant="destructive" size="sm" onClick={() => logout?.()}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
