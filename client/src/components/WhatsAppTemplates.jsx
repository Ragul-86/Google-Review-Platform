import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappAPI, servicesAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Pencil, Trash2, Star, Eye, MessageCircle, Loader2, Sparkles, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Constants ──────────────────────────────────────────────── */
const TYPES = [
  { value: 'review_request', label: 'Review Request' },
  { value: 'follow_up',      label: 'Follow-up Reminder' },
  { value: 'thank_you',      label: 'Thank You Message' },
  { value: 'custom',         label: 'Custom' },
];
const TYPE_COLORS = {
  review_request: 'bg-blue-100 text-blue-700',
  follow_up:      'bg-yellow-100 text-yellow-700',
  thank_you:      'bg-green-100 text-green-700',
  custom:         'bg-purple-100 text-purple-700',
};
const VARIABLES = [
  { token: '{{CustomerName}}',   hint: 'Customer name' },
  { token: '{{BusinessName}}',   hint: 'Your business name' },
  { token: '{{ReviewLink}}',     hint: 'Review page URL' },
  { token: '{{PurposeOfVisit}}', hint: 'Visit purpose' },
  { token: '{{VisitDate}}',      hint: 'Visit date' },
];
const TONES = ['Friendly and warm', 'Professional', 'Casual and fun', 'Polite and formal', 'Enthusiastic'];
const GOALS = ['Ask for a Google review', 'Follow up after service', 'Thank customer for visit', 'Re-engage past customers', 'Custom message'];
const EMPTY = { name: '', type: 'review_request', content: '', isDefault: false };

/* ── Variable replacement ───────────────────────────────────── */
export function fillTemplate(content, customer, client) {
  if (!content) return '';
  const reviewLink = `${window.location.origin}/review/${client?.slug || ''}`;
  return content
    .replace(/\{\{CustomerName\}\}/g,   customer?.name           || 'Customer')
    .replace(/\{\{BusinessName\}\}/g,   client?.businessName     || 'Business')
    .replace(/\{\{ReviewLink\}\}/g,     reviewLink)
    .replace(/\{\{PurposeOfVisit\}\}/g, customer?.purposeOfVisit || 'your visit')
    .replace(/\{\{VisitDate\}\}/g,
      customer?.visitDate
        ? new Date(customer.visitDate).toLocaleDateString()
        : new Date().toLocaleDateString()
    );
}

function previewContent(content, businessName, slug) {
  const reviewLink = `${window.location.origin}/review/${slug || 'your-business'}`;
  return (content || '')
    .replace(/\{\{CustomerName\}\}/g,   'John Doe')
    .replace(/\{\{BusinessName\}\}/g,   businessName || 'Your Business')
    .replace(/\{\{ReviewLink\}\}/g,     reviewLink)
    .replace(/\{\{PurposeOfVisit\}\}/g, 'Haircut')
    .replace(/\{\{VisitDate\}\}/g,      new Date().toLocaleDateString());
}

/* ── AI Generator Dialog ────────────────────────────────────── */
function AIGeneratorDialog({ open, onClose, onUseContent, businessCategory, services }) {
  const [aiForm, setAiForm] = useState({
    businessType: businessCategory || 'Service Business',
    services:     services.map((s) => s.name).join(', '),
    templateGoal: 'Ask for a Google review',
    tone:         'Friendly and warm',
  });
  const [generating, setGenerating]   = useState(false);
  const [generatedContent, setContent] = useState('');
  const af = (k) => (v) => setAiForm((p) => ({ ...p, [k]: v }));

  async function generate() {
    if (!aiForm.businessType.trim()) return toast.error('Business type is required');
    setGenerating(true);
    setContent('');
    try {
      const res = await whatsappAPI.aiGenerate(aiForm);
      setContent(res.data.content || '');
      toast.success('Template generated!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setContent(''); } }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Template Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Business Type *</Label>
              <Input
                value={aiForm.businessType}
                onChange={(e) => af('businessType')(e.target.value)}
                placeholder="Salon, Clinic, Restaurant…"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Select value={aiForm.tone} onValueChange={af('tone')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Your Services (comma separated)</Label>
            <Input
              value={aiForm.services}
              onChange={(e) => af('services')(e.target.value)}
              placeholder="Hair Cut, Hair Spa, Facial…"
            />
          </div>

          <div>
            <Label>Template Goal</Label>
            <Select value={aiForm.templateGoal} onValueChange={af('templateGoal')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Generate button */}
          <Button className="w-full gap-2" onClick={generate} disabled={generating}>
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Sparkles className="h-4 w-4" /> Generate Template</>}
          </Button>

          {/* Generated output */}
          {generatedContent && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <Label className="text-sm font-semibold text-gray-700">Generated Content</Label>
              <Textarea
                rows={8}
                value={generatedContent}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm resize-y"
              />
              <p className="text-xs text-gray-400">You can edit above before using</p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => { onUseContent(generatedContent); onClose(); setContent(''); }}
                >
                  Use This Template
                </Button>
                <Button variant="outline" onClick={() => setContent('')}>Clear</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Template Editor ────────────────────────────────────────── */
function TemplateEditor({ initial, onSave, loading, onCancel, onAIGenerate }) {
  const { user } = useAuth();
  const client   = user?.client;
  const [form, setForm]       = useState(initial);
  const [showPrev, setShowPrev] = useState(false);
  const textareaRef = useRef(null);

  // Allow parent to inject AI-generated content
  const setContent = useCallback((content) => {
    setForm((p) => ({ ...p, content }));
  }, []);

  function insertVar(token) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const next = form.content.substring(0, s) + token + form.content.substring(e);
    setForm((p) => ({ ...p, content: next }));
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = s + token.length;
      el.focus();
    }, 0);
  }

  return (
    <div className="space-y-4 mt-1">
      {/* Name + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Template Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Review Request"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Variable chips */}
      <div>
        <Label className="mb-1.5 block">Insert Variable</Label>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button
              key={v.token}
              type="button"
              title={v.hint}
              onClick={() => insertVar(v.token)}
              className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-mono transition-colors"
            >
              {v.token}
            </button>
          ))}
        </div>
      </div>

      {/* Content header: AI button + preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Message Content *</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAIGenerate(setContent)}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Generate
            </button>
            <span className="text-gray-200">|</span>
            <button
              type="button"
              onClick={() => setShowPrev((s) => !s)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Eye className="h-3.5 w-3.5" />
              {showPrev ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>

        {showPrev ? (
          <div className="rounded-xl border border-gray-200 bg-green-50 p-4 text-sm whitespace-pre-wrap leading-relaxed text-gray-800 min-h-[160px]">
            {previewContent(form.content, client?.businessName, client?.slug) || (
              <span className="text-gray-400 italic">Message preview appears here…</span>
            )}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            rows={8}
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder={`Hi {{CustomerName}},\n\nThank you for visiting {{BusinessName}}!\n\n{{ReviewLink}}`}
            className="font-mono text-sm resize-y"
          />
        )}
        <p className="text-xs text-gray-400 mt-1">{form.content.length} / 2000 characters</p>
      </div>

      {/* Set default */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
          className="rounded"
        />
        <span className="text-sm font-medium text-gray-700">Set as default template</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={() => onSave(form)} disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Template'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function WhatsAppTemplates() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const client   = user?.client;

  const [createOpen, setCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [aiOpen, setAiOpen]           = useState(false);
  const [aiContentSetter, setAiContentSetter] = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['wa-templates'] });

  const { data, isLoading } = useQuery({
    queryKey: ['wa-templates'],
    queryFn: () => whatsappAPI.getAll().then((r) => r.data.data),
  });

  // Fetch active services for AI context
  const { data: servicesData } = useQuery({
    queryKey: ['services', '', 'active'],
    queryFn: () => servicesAPI.getAll({ status: 'active' }).then((r) => r.data.data),
    staleTime: 60_000,
  });
  const activeServices = servicesData ?? [];

  const createMut = useMutation({
    mutationFn: whatsappAPI.create,
    onSuccess: () => { toast.success('Template created'); setCreateOpen(false); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => whatsappAPI.update(id, data),
    onSuccess: () => { toast.success('Template updated'); setEditTarget(null); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const deleteMut = useMutation({
    mutationFn: whatsappAPI.delete,
    onSuccess: () => { toast.success('Deleted'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const defaultMut = useMutation({
    mutationFn: whatsappAPI.setDefault,
    onSuccess: () => { toast.success('Default template set'); invalidate(); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  // Called from TemplateEditor's "AI Generate" link; passes a setter to inject content
  function openAI(setter) {
    setAiContentSetter(() => setter); // wrap in fn to avoid React treating it as updater
    setAiOpen(true);
  }

  const templates = data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">WhatsApp Templates</h2>
          <p className="text-xs text-gray-500 mt-0.5">Create and manage review request message templates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => { setAiOpen(true); setAiContentSetter(null); }}>
            <Sparkles className="h-4 w-4" /> AI Generate
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Template
          </Button>
        </div>
      </div>

      {/* Variables reference */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2">Supported Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map((v) => (
              <span key={v.token} title={v.hint}
                className="px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-700 text-xs font-mono">
                {v.token}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No templates yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <Card key={tpl._id} className={cn('transition-shadow', tpl.isDefault && 'ring-2 ring-green-300')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{tpl.name}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLORS[tpl.type] ?? TYPE_COLORS.custom)}>
                        {TYPES.find((t) => t.value === tpl.type)?.label ?? tpl.type}
                      </span>
                      {tpl.isDefault && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <Star className="h-3 w-3 fill-green-500 text-green-500" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-line leading-relaxed">
                      {previewContent(tpl.content, client?.businessName, client?.slug)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!tpl.isDefault && (
                      <button title="Set as default" onClick={() => defaultMut.mutate(tpl._id)}
                        className="h-8 w-8 rounded-lg bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center text-yellow-600 transition-colors">
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button title="Edit" onClick={() => setEditTarget(tpl)}
                      className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button title="Delete" onClick={() => { if (window.confirm(`Delete "${tpl.name}"?`)) deleteMut.mutate(tpl._id); }}
                      className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Generator dialog (standalone — top-level button) */}
      <AIGeneratorDialog
        open={aiOpen}
        onClose={() => { setAiOpen(false); setAiContentSetter(null); }}
        onUseContent={(content) => {
          if (aiContentSetter) {
            aiContentSetter(content);
          } else {
            // open create dialog pre-filled
            setCreateOpen(true);
            // store pending content — handled via useEffect alternative:
            // we piggy-back via a ref trick is messy; better to open create modal with pending content
          }
        }}
        businessCategory={client?.businessCategory || ''}
        services={activeServices}
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New WhatsApp Template</DialogTitle></DialogHeader>
          <TemplateEditor
            initial={{ ...EMPTY, isDefault: templates.length === 0 }}
            onSave={(form) => {
              if (!form.name.trim() || !form.content.trim()) return toast.error('Name and content are required');
              createMut.mutate(form);
            }}
            loading={createMut.isPending}
            onCancel={() => setCreateOpen(false)}
            onAIGenerate={openAI}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          {editTarget && (
            <TemplateEditor
              initial={{ name: editTarget.name, type: editTarget.type, content: editTarget.content, isDefault: editTarget.isDefault }}
              onSave={(form) => {
                if (!form.name.trim() || !form.content.trim()) return toast.error('Name and content are required');
                updateMut.mutate({ id: editTarget._id, data: form });
              }}
              loading={updateMut.isPending}
              onCancel={() => setEditTarget(null)}
              onAIGenerate={openAI}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
