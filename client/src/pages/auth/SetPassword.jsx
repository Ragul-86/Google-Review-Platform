import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function SetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [show, setShow]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const weak = password.length > 0 && password.length < 6;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    if (!token || !email) return toast.error('Invalid setup link — please use the link from your setup message');

    setLoading(true);
    try {
      await authAPI.setPassword({ token, email, newPassword: password });
      setDone(true);
      toast.success('Password set successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to set password. Please contact admin.');
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Invalid Setup Link</h1>
            <p className="text-sm text-gray-500 mt-2">
              This link is incomplete or has expired. Please contact your admin for a new setup link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8">
          {done ? (
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Password Set Successfully!</h1>
              <p className="text-sm text-gray-500 mt-2">
                You can now log in with your email and new password.
              </p>
              <Button className="w-full mt-6" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Set Your Password</h1>
                  <p className="text-xs text-gray-400">One-time setup for your business account</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                Setting up account for: <strong>{email}</strong>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={show ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={weak ? 'border-red-400' : password.length >= 6 ? 'border-green-400' : ''}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShow((s) => !s)}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {weak && <p className="text-xs text-red-500 mt-1">Too short — minimum 6 characters</p>}
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`mt-1 ${mismatch ? 'border-red-400' : confirm.length > 0 && confirm === password ? 'border-green-400' : ''}`}
                  />
                  {mismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || weak || (confirm.length > 0 && mismatch)}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting password…</>
                  ) : 'Set Password & Continue'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
