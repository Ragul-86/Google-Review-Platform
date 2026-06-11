import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { whatsappAPI } from '@/api';
import { fillTemplate } from '@/components/WhatsAppTemplates';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle, Sparkles, Star, Send, Loader2, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TABS = ['my-templates', 'ai-suggested'];

const TYPE_COLORS = {
  review_request: 'bg-blue-100 text-blue-700',
  follow_up:      'bg-yellow-100 text-yellow-700',
  thank_you:      'bg-green-100 text-green-700',
  custom:         'bg-purple-100 text-purple-700',
};
const TYPE_LABELS = {
  review_request: 'Review Request',
  follow_up:      'Follow-up',
  thank_you:      'Thank You',
  custom:         'Custom',
};

/* ── Quick fallback AI messages ─────────────────────────────── */
function buildAISuggestions(customer, client) {
  const name    = customer?.name                                         || 'Customer';
  const biz     = client?.businessName                                   || 'our business';
  const purpose = customer?.serviceName || customer?.purposeOfVisit || 'your recent visit';
  const base    = `${window.location.origin}/review/${client?.slug || ''}`;
  const link    = customer?._id ? `${base}?c=${customer._id}` : base;

  return [
    {
      label: 'Friendly Request',
      content: `Hi ${name}! 👋\n\nThank you for choosing *${biz}* for ${purpose}. Hope you had a great experience! 😊\n\nWe'd love it if you could spare 30 seconds to leave us a Google review — it really helps us grow!\n\n👉 ${link}\n\nThank you so much! 🙏\n\n*${biz}*`,
    },
    {
      label: 'Short & Sweet',
      content: `Hi ${name}, thanks for visiting *${biz}*! 🌟\n\nWould you mind leaving us a quick Google review?\n👉 ${link}\n\nYour feedback means a lot to us! 🙏`,
    },
    {
      label: 'Formal',
      content: `Dear ${name},\n\nThank you for choosing *${biz}* for ${purpose}.\n\nWe hope your experience was exceptional. We kindly request you to share your valued feedback on Google — it takes less than a minute and helps us serve you better.\n\n🔗 ${link}\n\nWith warm regards,\n*${biz}*`,
    },
  ];
}

/* ── Message Preview ────────────────────────────────────────── */
function MessageBubble({ content }) {
  return (
    <div className="bg-[#dcf8c6] rounded-xl rounded-tl-none px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed shadow-sm max-w-full font-[system-ui]">
      {content || <span className="text-gray-400 italic">Select a template to preview…</span>}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────── */
export function WhatsAppSendDialog({ open, onClose, customer, client, onSent }) {
  const [tab, setTab]                   = useState('my-templates');
  const [selectedId, setSelectedId]     = useState(null);   // template._id for tab 1
  const [selectedAiIdx, setAiIdx]       = useState(null);   // index for tab 2
  const [previewText, setPreviewText]   = useState('');
  const [editedPreview, setEdited]      = useState('');
  const [loadingAI, setLoadingAI]       = useState(false);
  const [aiSuggestions, setAiSugs]      = useState([]);

  /* ── Fetch saved templates ──────────────────────────────── */
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['wa-templates'],
    queryFn:  () => whatsappAPI.getAll().then((r) => r.data.data),
    enabled:  open,
    staleTime: 30_000,
  });

  /* ── Reset on open ──────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    setTab('my-templates');
    setSelectedId(null);
    setAiIdx(null);
    setPreviewText('');
    setEdited('');
    setAiSugs([]);
  }, [open]);

  /* ── Auto-select default template ──────────────────────── */
  useEffect(() => {
    if (!open || !templates.length || selectedId) return;
    const def = templates.find((t) => t.isDefault) ?? templates[0];
    if (def) selectTemplate(def);
  }, [templates, open]);

  /* ── Select a saved template ────────────────────────────── */
  function selectTemplate(tpl) {
    setSelectedId(tpl._id);
    setAiIdx(null);
    const filled = fillTemplate(tpl.content, customer, client);
    setPreviewText(filled);
    setEdited(filled);
  }

  /* ── Select an AI suggestion ────────────────────────────── */
  function selectAI(idx) {
    setSelectedId(null);
    setAiIdx(idx);
    const msg = aiSuggestions[idx]?.content || '';
    setPreviewText(msg);
    setEdited(msg);
  }

  /* ── Generate AI suggestions ────────────────────────────── */
  async function generateAI() {
    setLoadingAI(true);
    try {
      const sug = buildAISuggestions(customer, client);
      // Try API-based generation for the first suggestion
      const res = await whatsappAPI.aiGenerate({
        businessType:  client?.businessCategory || 'Service Business',
        services:      customer?.serviceName || customer?.purposeOfVisit || '',
        templateGoal:  'Ask for a Google review',
        tone:          'Friendly and warm',
      });
      if (res.data.content) {
        const reviewLink = `${window.location.origin}/review/${client?.slug || ''}`;
        const filled = res.data.content
          .replace(/\{\{CustomerName\}\}/g,   customer?.name           || 'Customer')
          .replace(/\{\{BusinessName\}\}/g,   client?.businessName     || 'Business')
          .replace(/\{\{ReviewLink\}\}/g,     reviewLink)
          .replace(/\{\{PurposeOfVisit\}\}/g, customer?.serviceName || customer?.purposeOfVisit || 'your visit')
          .replace(/\{\{VisitDate\}\}/g,
            customer?.visitDate
              ? new Date(customer.visitDate).toLocaleDateString()
              : new Date().toLocaleDateString()
          );
        sug[0] = { label: 'AI Generated', content: filled };
      }
      setAiSugs(sug);
      selectAI(0);
    } catch {
      // fall back to built-in suggestions
      const sug = buildAISuggestions(customer, client);
      setAiSugs(sug);
      selectAI(0);
    } finally {
      setLoadingAI(false);
    }
  }

  /* ── Switch to AI tab ───────────────────────────────────── */
  function switchTab(t) {
    setTab(t);
    if (t === 'ai-suggested' && aiSuggestions.length === 0) generateAI();
  }

  /* ── Send via WhatsApp ──────────────────────────────────── */
  function send() {
    const phone = (customer?.phone || '').replace(/\D/g, '');
    if (!phone) { toast.error('No phone number for this customer'); return; }
    if (!editedPreview.trim()) { toast.error('Please select a template first'); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(editedPreview)}`, '_blank', 'noopener,noreferrer');
    onSent?.();
    onClose();
    toast.success('WhatsApp opened!');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Send WhatsApp Review Request
          </DialogTitle>
          {customer && (
            <p className="text-xs text-gray-500 mt-0.5">
              To: <span className="font-medium text-gray-700">{customer.name}</span>
              {customer.phone && <span className="ml-1 font-mono">({customer.phone})</span>}
              {(customer.serviceName || customer.purposeOfVisit) && (
                <span className="ml-1">— {customer.serviceName || customer.purposeOfVisit}</span>
              )}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left panel: template selection ─────────────── */}
          <div className="w-[52%] border-r border-gray-100 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
              {[
                { id: 'my-templates',  label: 'My Templates', icon: MessageCircle },
                { id: 'ai-suggested',  label: 'AI Suggested',  icon: Sparkles },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors',
                    tab === id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tab === 'my-templates' && (
                isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />)}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    <MessageCircle className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                    No templates yet. Go to Settings → WhatsApp Templates to create one.
                  </div>
                ) : (
                  templates.map((tpl) => (
                    <button
                      key={tpl._id}
                      onClick={() => selectTemplate(tpl)}
                      className={cn(
                        'w-full text-left rounded-xl border p-3 transition-all group',
                        selectedId === tpl._id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/60',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs font-semibold text-gray-900">{tpl.name}</p>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', TYPE_COLORS[tpl.type] ?? TYPE_COLORS.custom)}>
                          {TYPE_LABELS[tpl.type] ?? tpl.type}
                        </span>
                        {tpl.isDefault && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600">
                            <Star className="h-2.5 w-2.5 fill-green-500" /> Default
                          </span>
                        )}
                        {selectedId === tpl._id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 whitespace-pre-line leading-relaxed">
                        {fillTemplate(tpl.content, customer, client)}
                      </p>
                    </button>
                  ))
                )
              )}

              {tab === 'ai-suggested' && (
                loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    <p className="text-sm">Generating AI messages…</p>
                  </div>
                ) : (
                  <>
                    {aiSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => selectAI(i)}
                        className={cn(
                          'w-full text-left rounded-xl border p-3 transition-all',
                          selectedAiIdx === i
                            ? 'border-purple-300 bg-purple-50/60 ring-1 ring-purple-200'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/60',
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-900">{sug.label}</p>
                          {selectedAiIdx === i && <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 whitespace-pre-line leading-relaxed">
                          {sug.content}
                        </p>
                      </button>
                    ))}
                    <button
                      onClick={generateAI}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-purple-300 text-xs text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Regenerate suggestions
                    </button>
                  </>
                )
              )}
            </div>
          </div>

          {/* ── Right panel: preview + send ─────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
              <p className="text-xs font-semibold text-gray-700">Message Preview</p>
              <p className="text-[11px] text-gray-400 mt-0.5">You can edit before sending</p>
            </div>

            {/* WhatsApp-style chat bg */}
            <div className="flex-1 overflow-y-auto p-4"
              style={{ background: 'url("https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png") repeat, #e5ddd5' }}
            >
              <MessageBubble content={editedPreview} />
            </div>

            {/* Editable textarea */}
            <div className="p-3 border-t border-gray-100 shrink-0 space-y-3">
              <Textarea
                value={editedPreview}
                onChange={(e) => setEdited(e.target.value)}
                rows={4}
                placeholder="Select a template on the left…"
                className="text-xs resize-none font-[system-ui] leading-relaxed"
              />
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={send}
                disabled={!editedPreview.trim()}
              >
                <Send className="h-4 w-4" />
                Open WhatsApp & Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
