import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { publicScratchAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, PartyPopper, Clock, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

/* ── Mystery scratch canvas ───────────────────────────────────────
   The actual reward is unknown until the server resolves the scratch
   (it's picked at random, at the moment of scratching — not before),
   so the foil here only ever covers a generic "Mystery Reward"
   placeholder. Once enough of the foil is cleared, we call the
   one-time scratch endpoint and swap this card out for the real
   result. */
function MysteryScratchCard({ onScratched, busy }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#FBBF24');
    grad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ SCRATCH HERE ✦', canvas.width / 2, canvas.height / 2);
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: (point.clientX - rect.left) * (canvas.width / rect.width),
      y: (point.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function fireReveal() {
    if (firedRef.current) return;
    firedRef.current = true;
    onScratched();
  }

  function scratch(e) {
    if (firedRef.current || busy) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    let sampled = 0;
    for (let i = 3; i < data.length; i += 4 * 20) { sampled++; if (data[i] === 0) cleared++; }
    if (sampled > 0 && cleared / sampled > 0.45) fireReveal();
  }

  return (
    <div className="relative mx-auto w-full max-w-xs h-44 rounded-2xl overflow-hidden shadow-lg border border-amber-200">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-white text-center px-4">
        <Gift className="h-9 w-9 text-amber-400 mb-2" />
        <p className="text-sm font-semibold text-gray-700">Mystery Reward</p>
        <p className="text-xs text-gray-400 mt-1">Scratch to find out what you won</p>
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={176}
        className={cn('absolute inset-0 w-full h-full touch-none', busy ? 'cursor-wait' : 'cursor-pointer')}
        onMouseDown={() => { drawingRef.current = true; }}
        onMouseUp={() => { drawingRef.current = false; }}
        onMouseLeave={() => { drawingRef.current = false; }}
        onMouseMove={(e) => drawingRef.current && scratch(e)}
        onTouchStart={(e) => { drawingRef.current = true; scratch(e); }}
        onTouchEnd={() => { drawingRef.current = false; }}
        onTouchMove={scratch}
        onDoubleClick={fireReveal}
      />
      {busy && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Public Scratch Card page — /reward/:token

   This link is only ever delivered by the client manually pressing
   Send inside WhatsApp — GETMORE never sends it automatically. It is
   secure and strictly single-use:
     • First open    → scratch animation → server picks a random
       reward and reveals it (exactly once).
     • Reopened link → static "reward already opened" details.
     • Past 30 days (from reveal) → "Reward Expired".
     • Unknown/bad token → "Invalid Link".
   ════════════════════════════════════════════════════════════════ */
export default function ScratchCardPage() {
  const { token } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | scratch | revealing | result | expired | invalid
  const [reward, setReward] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [noRewardsLeft, setNoRewardsLeft] = useState(false);

  useEffect(() => {
    let active = true;
    publicScratchAPI.getByToken(token)
      .then((res) => {
        if (!active) return;
        const d = res.data.data;
        setReward(d);
        if (d.rewardStatus === 'expired') setPhase('expired');
        else if (d.isScratched) setPhase('result');
        else setPhase('scratch');
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err?.response?.data?.message || 'This reward link is invalid or no longer available.');
        setPhase('invalid');
      });
    return () => { active = false; };
  }, [token]);

  async function handleScratched() {
    setPhase('revealing');
    try {
      const res = await publicScratchAPI.scratch(token);
      if (res.data?.success && res.data?.data) {
        setReward((prev) => ({ ...prev, ...res.data.data, isScratched: true, rewardStatus: 'scratched' }));
        setPhase('result');
      } else {
        setNoRewardsLeft(true);
        setPhase('result');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong revealing your reward.';
      toast.error(msg);
      // Refetch authoritative state — covers already-revealed / just-expired races
      try {
        const res = await publicScratchAPI.getByToken(token);
        const d = res.data.data;
        setReward(d);
        setPhase(d.rewardStatus === 'expired' ? 'expired' : d.isScratched ? 'result' : 'scratch');
      } catch {
        setErrorMsg(msg);
        setPhase('invalid');
      }
    }
  }

  async function handleCopy() {
    if (!reward?.couponCode) return;
    await copyToClipboard(reward.couponCode);
    setCopied(true);
    toast.success('Coupon code copied');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBBF24]/8 via-[#F8FAFC] to-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="p-8 text-center">

            {phase === 'loading' && (
              <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Loading your reward…</p>
              </div>
            )}

            {phase === 'invalid' && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="font-bold text-xl text-gray-900 mb-2">Invalid Link</h2>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
              </>
            )}

            {phase === 'expired' && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="font-bold text-xl text-gray-900 mb-2">Reward Expired</h2>
                <p className="text-sm text-muted-foreground">
                  This Scratch Card's 30-day validity window has passed.
                  Please contact {reward?.businessName || 'the business'} for assistance.
                </p>
              </>
            )}

            {(phase === 'scratch' || phase === 'revealing') && (
              <>
                <h2 className="font-bold text-xl text-gray-900 mb-1">
                  {reward?.businessName ? `A gift from ${reward.businessName}` : "You've Got a Reward!"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Hi {reward?.customerName || 'there'} — scratch the card below to reveal your reward.
                </p>
                <MysteryScratchCard onScratched={handleScratched} busy={phase === 'revealing'} />
                <p className="text-xs text-gray-400 mt-4">This card can only be opened once.</p>
              </>
            )}

            {phase === 'result' && (
              <div className="animate-in fade-in duration-300">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                  <PartyPopper className="h-8 w-8 text-green-500" />
                </div>

                {noRewardsLeft ? (
                  <>
                    <h2 className="font-bold text-xl text-gray-900 mb-2">No Rewards Available</h2>
                    <p className="text-sm text-muted-foreground">
                      All rewards have been claimed for now. Please contact {reward?.businessName || 'the business'} directly.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-bold text-xl text-gray-900 mb-1">Congratulations! 🎉</h2>
                    <p className="text-sm text-muted-foreground mb-5">You won</p>
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 mb-4">
                      <p className="text-3xl font-extrabold text-gray-900">₹{reward?.rewardAmount} OFF</p>
                      <p className="text-xs text-gray-400 mt-2">Coupon Code</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="font-mono font-semibold text-gray-800 text-lg">{reward?.couponCode}</span>
                        <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600" aria-label="Copy coupon code">
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {reward?.validUntil && (
                      <p className="text-xs font-medium text-amber-600 mb-1">
                        Valid until {fmtDate(reward.validUntil)}
                        {typeof reward.daysRemaining === 'number' ? ` (${reward.daysRemaining} day${reward.daysRemaining === 1 ? '' : 's'} left)` : ''}
                      </p>
                    )}
                    {reward?.rewardStatus === 'redeemed' && (
                      <p className="text-xs text-gray-400 mt-1">This coupon has already been redeemed.</p>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      Show this screen at {reward?.businessName || 'the store'} to redeem.
                    </p>
                  </>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
