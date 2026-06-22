import { useState, useEffect, useRef } from 'react';
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

/* ── Google URL validation ─────────────────────────────────────── */
const GOOGLE_REVIEW_HOSTS = [
  'search.google.com', 'g.page', 'maps.google.com',
  'maps.app.goo.gl', 'www.google.com', 'google.com',
];
function validateGoogleUrl(url) {
  if (!url?.trim()) return { valid: false, reason: 'missing' };
  try {
    const u = new URL(url.trim());
    if (!['https:', 'http:'].includes(u.protocol)) return { valid: false, reason: 'invalid' };
    return GOOGLE_REVIEW_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h))
      ? { valid: true } : { valid: false, reason: 'invalid' };
  } catch { return { valid: false, reason: 'invalid' }; }
}

/* ── Clipboard ─────────────────────────────────────────────────── */
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

/* ── Submission key for localStorage ──────────────────────────── */
function submissionKey(slug) { return `review_done_${slug}`; }
function markDone(slug)       { try { localStorage.setItem(submissionKey(slug), '1'); } catch {} }
function isDone(slug)         { try { return !!localStorage.getItem(submissionKey(slug)); } catch { return false; } }

/* ════════════════════════════════════════════════════════════════ */
export default function ReviewPage() {
  const { slug } = useParams();

  /* ── State ── */
  const [step, setStep]                 = useState('rate');
  const [rating, setRating]             = useState(0);
  const [hover, setHover]               = useState(0);
  const [submitting, setSubmitting]     = useState(false);
  const [googleLink, setGoogleLink]     = useState('');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [suggestions, setSuggestions]   = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService,  setSelectedService]  = useState(null);
  const [copyingIdx, setCopyingIdx] = useState(null);
  const [copiedIdx,  setCopiedIdx]  = useState(null);

  // Negative feedback
  const [name,    setName]    = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const qrToken    = new URLSearchParams(window.location.search).get('qr');
  const customerId = new URLSearchParams(window.location.search).get('c');

  /* ── Data fetch ── */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-client', slug],
    queryFn:  () => publicAPI.getClientBySlug(slug).then((r) => r.data.data),
    retry: false,
  });

  /* ── Check duplicate on mount — redirect to thankyou if already submitted ── */
  useEffect(() => {
    if (slug && isDone(slug)) setStep('thankyou');
  }, [slug]);

  /* ── Track "opened" once ── */
  const trackedOpen = useRef(false);
  useEffect(() => {
    if (!customerId || !data?.client || trackedOpen.current) return;
    trackedOpen.current = true;
    publicAPI.trackCustomer(customerId, 'opened').catch(() => {});
  }, [customerId, data?.client?._id]);  // eslint-disable-line

  /* ── Loading / Error ── */
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

  /* ── Handlers ── */
  function handleRate(stars) {
    setRating(stars);
    // Positive: must go through service (if any) and then category — no skip
    setStep(stars >= 4 ? (activeServices.length > 0 ? 'service' : 'category') : 'negative');
  }

  function handleServiceSelect(svc) {
    setSelectedService(svc);
    setStep('category');
  }

  /* No skipService — service is REQUIRED */

  async function handleCategory(cat) {
    // Validate: if services exist, one must be selected
    if (activeServices.length > 0 && !selectedService) {
      toast.error('Please select a service before continuing.');
      setStep('service');
      return;
    }
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

  /* ── Copy & Redirect ──────────────────────────────────────────
     1. Validate Google URL
     2. Copy review text
     3. Toast
     4. Submit in background + 1s delay
     5. Open Google Reviews
     6. Mark done (localStorage) + show Thank You page
  ─────────────────────────────────────────────────────────────── */
  async function handleCopy(text, idx) {
    if (copyingIdx !== null) return;

    const rawUrl = client.googleReviewLink?.trim() || '';
    const { valid, reason } = validateGoogleUrl(rawUrl);

    if (!valid) {
      toast.error(reason === 'missing'
        ? 'Google Review URL is not configured for this business.'
        : 'Invalid Google Review URL. Please contact the business owner.');
      return;
    }

    setCopyingIdx(idx);

    await copyToClipboard(text);

    toast.success('Review copied successfully. Redirecting to Google Review...', { duration: 4000 });

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
          console.warn('[ReviewPage] submit failed (non-fatal):', err?.message);
        }
      })(),
      new Promise((r) => setTimeout(r, 1000)),
    ]);

    setCopyingIdx(null);
    setCopiedIdx(idx);
    setGoogleLink(rawUrl);

    if (customerId) publicAPI.trackCustomer(customerId, 'google_submitted').catch(() => {});

    let opened = false;
    try {
      const tab = window.open(rawUrl, '_blank', 'noopener,noreferrer');
      opened = !!(tab && !tab.closed);
    } catch { opened = false; }

    setPopupBlocked(!opened);

    // Mark done — prevent resubmission
    markDone(slug);
    setStep('thankyou');
  }

  async function handleNegativeSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewsAPI.submit({
        clientSlug: slug, rating, type: 'negative',
        customerName: name, customerPhone: contact,
        message, qrToken,
      });
      if (customerId) publicAPI.trackCustomer(customerId, 'feedback_submitted').catch(() => {});
      // Mark done — prevent resubmission
      markDone(slug);
      setStep('thankyou');
    } catch {
      toast.error('Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBBF24]/8 via-[#F8FAFC] to-[#F8FAFC]">
      <div className="container mx-auto max-w-xl px-4 py-10">

        {/* Header — business branding only; no platform branding shown to customer */}
        <header className="text-center mb-8">
          {client.businessLogo ? (
            <img src={client.businessLogo} alt={client.businessName}
              className="mx-auto h-20 w-20 rounded-2xl object-cover mb-4 shadow-lg border border-gray-100" />
          ) : (
            <div className="mx-auto h-20 w-20 rounded-2xl bg-[#111111] flex items-center justify-center mb-4 shadow-lg">
              <span className="text-[#FBBF24] font-extrabold text-3xl leading-none">
                {(client.businessName || 'B')[0].toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">{client.businessName}</h1>
          {client.address && <p className="text-sm text-gray-400 mt-1.5">{client.address}</p>}
        </header>

        {/* ── Rate ── */}
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

        {/* ── Service selection (REQUIRED — no skip) ── */}
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
              <p className="text-sm text-muted-foreground mb-5">
                Select a service to continue — this helps generate a relevant review.
              </p>
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
              {/* No skip button — service selection is mandatory */}
            </CardContent>
          </Card>
        )}

        {/* ── Category (REQUIRED) ── */}
        {step === 'category' && (
          <Card>
            <CardContent className="p-6">
              <button
                onClick={() => setStep(activeServices.length > 0 ? 'service' : 'rate')}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-semibold text-lg">What did you love most?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {selectedService
                  ? `About your ${selectedService.name} — what stood out?`
                  : 'Pick a category to continue.'}
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

        {/* ── Suggestions ── */}
        {step === 'suggestions' && (
          <Card>
            <CardContent className="p-6">
              <button onClick={() => setStep('category')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-semibold text-lg">Pick your review</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Tap <strong>Copy</strong> — your review is copied and Google Reviews opens automatically.
              </p>

              {/* Google URL warning */}
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

        {/* ── Negative feedback form ── */}
        {step === 'negative' && (
          <Card>
            <CardContent className="p-6">
              <button onClick={() => setStep('rate')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-semibold text-lg">We would love to make it right</h2>
              <p className="text-sm text-muted-foreground mb-5">
                You rated us {rating} star{rating === 1 ? '' : 's'}. Share your feedback privately — we will follow up.
              </p>
              <form onSubmit={handleNegativeSubmit} className="space-y-3">
                <div><Label>Name</Label><Input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Contact number</Label><Input required maxLength={60} value={contact} onChange={(e) => setContact(e.target.value)} /></div>
                <div><Label>What went wrong?</Label><Textarea required rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : 'Send feedback'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Thank You page — positive AND negative both land here ── */}
        {step === 'thankyou' && (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <h2 className="font-bold text-2xl text-gray-900 mb-3">Thank You</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Thank you for taking the time to share your feedback.
              </p>

              {/* If popup was blocked — show manual fallback button */}
              {popupBlocked && googleLink && (
                <a
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-6"
                >
                  <Button size="lg" className="w-full text-base font-semibold gap-2 py-5">
                    <ExternalLink className="h-5 w-5" />
                    Open Google Reviews
                  </Button>
                </a>
              )}

              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => window.close()}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Already submitted (shown if page is reopened after completion) ── */}
        {/* Handled by useEffect on mount that redirects to 'thankyou' step */}

      </div>
    </div>
  );
}
