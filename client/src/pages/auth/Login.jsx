import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#FBBF24] focus:ring-[#FBBF24]/20"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40 hover:text-white/70"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(e) {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      if (from) navigate(from, { replace: true });
      else if (user.role === 'superadmin') navigate('/admin/dashboard');
      else navigate('/client/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] px-4">
      {/* Subtle gold radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FBBF24]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/getmore-logo.png"
            alt="GETMORE"
            draggable="false"
            className="select-none drop-shadow-[0_0_32px_rgba(251,191,36,0.25)]"
            style={{ height: 52, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block' }}
          />
          <p className="text-white/30 text-[11px] mt-3">Powered by DMAX</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <h2 className="text-white font-bold text-[18px] mb-1">Sign In</h2>
          <p className="text-white/40 text-[13px] mb-6">Access your admin or business dashboard</p>

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <Label className="text-white/70 text-[13px] font-medium">Email</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-[#FBBF24] focus:ring-[#FBBF24]/20"
              />
            </div>
            <div>
              <Label className="text-white/70 text-[13px] font-medium">Password</Label>
              <div className="mt-1.5">
                <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#111111] font-bold text-[15px] mt-2 shadow-lg shadow-[#FBBF24]/20 transition-all"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-[11px] mt-6">
          GETMORE &copy; {new Date().getFullYear()} — Powered by DMAX
        </p>
      </div>
    </div>
  );
}
