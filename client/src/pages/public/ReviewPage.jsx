import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicAPI, reviewsAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Star, ExternalLink, CheckCircle2, ArrowLeft, Loader2, Copy, Check, Wrench, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── URL validation ──────────────────────────────────────────────
   Accepted formats:
     https://search.google.com/local/writereview?placeid=...
     https://g.page/r/...../review
     https://maps.google.com/...
     https://maps.app.goo.gl/...
     https://www.google.com/maps/...
─────────────────────────────────────────────────────────────── */
const GOOGLE_REVIEW_HOSTS = [
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
    const ok = GOOGLE_REVIEW_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith('.' + h),
    );
    return ok ? { valid: true } : { valid: false, reason: 'invalid' };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

/* ── Clipboard helper ────────────────────────────────────────── */
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

export default function ReviewPage() {
  const { slug } = useParams();

  /* ── State ──────────────────────────────────────────────── */
  const [step, setStep]                 = useState('rate');
  const [rating, setRating]             = useState(0);
  const [hover, setHover]               = useState(0);
  const [submitting, setSubmitting]     = useState(false);
  const [googleLink, setGoogleLink]     = useState('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [suggestions, setSuggestions]   = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService]   = useState(null);
  const [copyingIdx, setCopyingIdx]     = useState(null);   // loading state per card
  const [copiedIdx, setCopiedIdx]       = useState(null);   // success state per card

  // Negative feedback form
  const [name, setName]       = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');

  const qrToken = new URLSearchParams(window.location.search).get('qr');

  /* ── Data fetch ─────────────────────────────────────────── */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-client', slug],
    queryFn:  () => publicAPI.getClientBySlug(slug).then((r) => r.data.data),
    retry: false,
  });

  /* ── Loading / Error ────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isError || !data?.client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-semibold">This review link is no longer active</h1>
        <p className="text-sm text-muted-foreground mt-2">Please contact the business for an updated link.</p>
      </div>
    );
  }

  const { client, categories = [], services = [] } = data;
  const activeServices = services.filter((s) => s.status === 'active');

  /* ── Handlers ───────────────────────────────────────────── */
  function handleRate(stars) {
    setRating(stars);
    setStep(stars >= 4 ? (activeServices.length > 0 ? 'service' : 'category') : 'negative');
  }

  function handleServiceSelect(svc) {
    setSelectedService(svc);
    setStep('category');
  }

  function skipService() {
    setSelectedService(null);
    setStep('category');
  }

  async function handleCategory(cat) {
    setSelectedCategory(cat);
    setLoadingSuggestions(true);
    setSuggestions([]);
    setStep('suggestions');
    try {
      const res = await reviewsAPI.suggestions({
        businessName:  client.businessName,
        categoryLabel: cat.name,
        rating,
        serviceLabel:  selectedService?.name || '',
        businessType:  client.businessCategory || '',
      });
      setSuggestions(res.data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  /* ── Copy & Redirect ────────────────────────────────────────
     Flow (single click, fully automatic):
     1. Validate URL synchronously — abort immediately if missing/invalid
     2. Copy review text to clipboard
     3. Toast "Review copied! Redirecting…"
     4. Submit review in background + 1 s delay (parallel)
     5. window.open(validatedUrl, '_blank') — real URL, never blank
     6. If popup blocked → keep user on page, show manual button

     KEY: Never call window.open('', '_blank') then set location.href.
          That pattern leaves blank tabs when location redirect fails.
          Always open with the final URL directly.
  ─────────────────────────────────────────────────────────── */
  async function handleCopy(text, idx) {
    if (copyingIdx !== null) return;   // prevent double-tap

    // ① Validate URL — synchronous, zero side-effects, no tab opened yet
    const rawUrl = client.googleReviewLink?.trim() || '';
    const { valid, reason } = validateGoogleUrl(rawUrl);

    console.debug('[ReviewPage] Redirect check', {
      businessId:   client._id,
      businessName: client.businessName,
      googleUrl:    rawUrl || '(empty)',
      valid,
      reason: valid ? 'ok' : reason,
    });

    if (!valid) {
      const msg = reason === 'missing'
        ? 'Google Review URL is not configured for this business.'
        : 'Invalid Google Review URL. Please contact the business owner.';
      console.warn('[ReviewPage] Redirect aborted —', msg);
      toast.error(msg);
      return;   // ← stops here, zero tabs opened
    }

    setCopyingIdx(idx);

    // ② Copy to clipboard
    const copied = await copyToClipboard(text);
    if (!copied) {
      console.warn('[ReviewPage] Clipboard write failed — continuing anyway');
    }

    // ③ Toast
    toast.success('✅ Review copied successfully. Redirecting to Google Review…', { duration: 4000 });

    // ④ Submit review + 1 s delay in parallel (non-blocking)
    await Promise.all([
      (async () => {
        try {
          await reviewsAPI.submit({
            clientSlug:    slug,
            rating,
            type:          'positive',
            categoryLabel: selectedCategory?.name,
            serviceLabel:  selectedService?.name,
            qrToken,
          });
        } catch (err) {
          console.warn('[ReviewPage] Review submit failed (non-fatal):', err?.message);
        }
      })(),
      new Promise((r) => setTimeout(r, 1000)),
    ]);

    setCopyingIdx(null);
    setCopiedIdx(idx);
    setGoogleLink(rawUrl);    // always use the validated URL, not server response

    // ⑤ Open the real URL directly — NEVER pre-open blank tabs
    let opened = false;
    try {
      const tab = window.open(rawUrl, '_blank', 'noopener,noreferrer');
      // window.open returns null when blocked; some browsers return a closed window
      opened = !!(tab && !tab.closed);
      console.debug('[ReviewPage] window.open result:', opened ? 'opened' : 'blocked', rawUrl);
    } catch (err) {
      console.error('[ReviewPage] window.open threw:', err);
      opened = false;
    }

    setPopupBlocked(!opened);

    if (!opened) {
      console.warn('[ReviewPage] Popup blocked — showing manual fallback button');
    }

    setStep('done');
  }

  async function handleNegativeSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewsAPI.submit({
        clientSlug: slug, rating, type: 'negative',
        customerName: name, customerPhone: contact,
        customerEmail: email, message, qrToken,
      });
      setStep('thanks');
    } catch {
      toast.error('Could not submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-background to-background">
      <div className="container mx-auto max-w-xl px-4 py-10">
        {/* Header */}
        <header className="text-center mb-8">
          {client.businessLogo ? (
            <img src={client.businessLogo} alt={client.businessName}
              className="mx-auto h-16 w-16 rounded-full object-cover mb-3 shadow-md" />
          ) : (
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <span className="text-primary font-bold text-2xl">{(client.businessName || 'R')[0]}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold">{client.businessName}</h1>
          {client.address && <p className="text-sm text-muted-foreground mt-1">{client.address}</p>}
        </header>

        {/* ── Step: Rate ──────────────────────────────────── */}
        {step === 'rate' && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold">How was your experience?</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Tap a star to rate us</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => handleRate(n)}
                    className="transition-transform active:scale-90 hover:scale-110"
                    aria-label={`${n} stars`}
                  >
                    <Star className={cn(
                      'h-12 w-12 transition-colors',
                      n <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30',
                    )} />
                  </button>
                ))}
              </div>
              {(hover || rating) > 0 && (
                <p className="mt-3 text-sm font-medium text-yellow-600 animate-in fade-in duration-200">
                  {STAR_LABELS[hover || rating]}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step: Service selection ──────────────────────── */}
        {step === 'service' && (
          <Card>
            <CardContent className="p-6">
              <button onClick={() => setStep('rate')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Which service did you use?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">This helps us personalise your review.</p>
              <div className="grid grid-cols-2 gap-2">
                {activeServices.map((svc) => (
                  <button
                    key={svc._id}
                    onClick={() => handleServiceSelect(svc)}
                    className={cn(
                      'rounded-xl border p-3 text-left text-sm font-medium',
                      'hover:border-primary hover:bg-primary/5 transition-colors active:scale-95',
                    )}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                    {svc.category && <p className="text-xs text-gray-400 mt-0.5">{svc.category}</p>}
                  </button>
                ))}
              </div>
              <button
                onClick={skipService}
                className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Skip — I'd rather not say
              </button>
            </CardContent>
          </Card>
        )}

        {/* ── Step: Category ──────────────────────────────── */}
        {step === 'category' && (
          <Card>
            <CardContent className="p-6">
              <button onClick={() => setStep(activeServices.length > 0 ? 'service' : 'rate')}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-semibold text-lg">What did you love most?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {selectedService
                  ? `About your ${selectedService.name} — what stood out?`
                  : "Pick one — we'll craft your Google review."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleCategory(c)}
                    disabled={submitting}
                    className={cn(
                      'rounded-full border bg-background px-4 py-2 text-sm font-medium',
                      'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                      'transition-colors active:scale-95 disabled:opacity-50',
                    )}
                  >
                    {c.name}
                  </button>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No categories configured yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step: Suggestions ───────────────────────────── */}
        {step === 'suggestions' && (
          <Card>
            <CardContent className="p-6">
              <button onClick={() => setStep('category')}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-semibold text-lg">Pick your review</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Tap <strong>Copy</strong> — your review is copied and Google Reviews opens automatically.
              </p>

              {/* URL warning banner — shown if Google URL is missing/invalid */}
              {(() => {
                const { valid, reason } = validateGoogleUrl(client.googleReviewLink);
                if (valid) return null;
                return (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>
                      {reason === 'missing'
                        ? 'Google Review URL is not configured for this business.'
                        : 'Invalid Google Review URL. Please contact the business owner.'}
                    </span>
                  </div>
                );
              })()}

              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Crafting your personalised reviews…</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-500 mb-3">Could not generate suggestions.</p>
                  <button onClick={() => handleCategory(selectedCategory)} className="text-sm text-primary underline">
                    Try again
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((text, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-xl border bg-background p-4 transition-all',
                        copyingIdx === i || copiedIdx === i
                          ? 'border-green-400 bg-green-50/60 ring-1 ring-green-300'
                          : 'border-gray-200 hover:border-primary/40',
                      )}
                    >
                      <p className="text-sm leading-relaxed text-gray-800 mb-3">{text}</p>
                      <Button
                        size="sm"
                        className={cn(
                          'w-full gap-2 transition-all',
                          copiedIdx === i
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : copyingIdx === i
                            ? 'bg-primary/80 text-primary-foreground cursor-wait'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90',
                        )}
                        disabled={copyingIdx !== null}
                        onClick={() => handleCopy(text, i)}
                      >
                        {copyingIdx === i ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                        ) : copiedIdx === i ? (
                          <><Check className="h-4 w-4" /> Copied!</>
                        ) : (
                          <><Copy className="h-4 w-4" /> Copy</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step: Done ──────────────────────────────────── */}
        {step === 'done' && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <h2 className="font-bold text-xl text-gray-900">
                {popupBlocked ? 'Review Copied!' : 'All done — thank you! 🎉'}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {popupBlocked
                  ? 'Your review was copied to the clipboard. Tap the button below to open Google Reviews and paste it.'
                  : 'Your review was copied and Google Reviews opened in a new tab. Just paste and hit Submit!'}
              </p>

              {/* Step progress */}
              <div className="mt-5 mb-6 flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                  Review copied
                </span>
                <span className="text-gray-300 shrink-0">──</span>
                <span className="flex items-center gap-1">
                  <span className={cn(
                    'h-5 w-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0',
                    popupBlocked ? 'bg-gray-300 text-gray-600' : 'bg-green-500',
                  )}>
                    {popupBlocked ? '2' : '✓'}
                  </span>
                  Google Reviews {popupBlocked ? '(tap below)' : 'opened'}
                </span>
                <span className="text-gray-300 shrink-0">──</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <span className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                    popupBlocked ? 'bg-gray-200 text-gray-500' : 'bg-primary text-primary-foreground',
                  )}>
                    {popupBlocked ? '3' : '2'}
                  </span>
                  Paste &amp; Submit
                </span>
              </div>

              {/* Fallback button — only when popup was blocked */}
              {popupBlocked && googleLink && (
                <a
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button size="lg" className="w-full text-base font-semibold gap-2 py-6">
                    <ExternalLink className="h-5 w-5" />
                    Open Google Reviews
                  </Button>
                </a>
              )}

              {!popupBlocked && (
                <p className="text-xs text-muted-foreground mt-2">
                  Just paste and tap Submit on Google Reviews.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step: Negative ──────────────────────────────── */}
        {step === 'negative' && (
          <Card>
            <CardContent className="p-6">
              <button onClick={() => setStep('rate')}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-semibold text-lg">We'd love to make it right</h2>
              <p className="text-sm text-muted-foreground mb-5">
                You rated us {rating} star{rating === 1 ? '' : 's'}. Share your feedback privately — we'll follow up.
              </p>
              <form onSubmit={handleNegativeSubmit} className="space-y-3">
                <div><Label>Name</Label><Input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Contact number</Label><Input required maxLength={60} value={contact} onChange={(e) => setContact(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>What went wrong?</Label><Textarea required rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : 'Send feedback'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step: Thanks ────────────────────────────────── */}
        {step === 'thanks' && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <h2 className="font-semibold text-xl mt-1">Feedback received</h2>
              <p className="text-sm text-muted-foreground mt-2">Thank you for letting us know. We'll be in touch shortly.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
