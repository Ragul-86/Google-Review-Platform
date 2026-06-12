import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI, clientsAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, Sparkles, Check, X, Pencil, Loader2,
  Building2, Layers, ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Industry types for the AI input ────────────────────────── */
const BUSINESS_TYPES = [
  'Salon', 'Hospital', 'Restaurant', 'Digital Marketing Agency',
  'Gym', 'Spa', 'Real Estate', 'Automobile Service', 'Education / Coaching',
  'Clinic', 'Hotel', 'Retail Store', 'E-commerce', 'Other',
];

/* ── Pill component ──────────────────────────────────────────── */
function Pill({ label, onRemove, onEdit, color = 'gray' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(label);

  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray:   'bg-gray-50 text-gray-600 border-gray-200',
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 border rounded-lg overflow-hidden">
        <input
          autoFocus
          className="text-xs px-2 py-1 outline-none w-28 bg-white"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onEdit(val.trim() || label); setEditing(false); }
            if (e.key === 'Escape') { setVal(label); setEditing(false); }
          }}
        />
        <button
          onClick={() => { onEdit(val.trim() || label); setEditing(false); }}
          className="px-1.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border-l border-gray-200"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={() => { setVal(label); setEditing(false); }}
          className="px-1.5 py-1 bg-red-50 hover:bg-red-100 text-red-500 border-l border-gray-200"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border cursor-default group', colors[color])}>
      {label}
      {onEdit && (
        <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="h-2.5 w-2.5" />
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

/* ── Category row (global templates) ────────────────────────── */
function CategoryRow({ cat, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(cat.name);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onMoveUp} disabled={isFirst} className="disabled:opacity-20 text-gray-400 hover:text-gray-700">
          <ChevronUp className="h-3 w-3" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="disabled:opacity-20 text-gray-400 hover:text-gray-700">
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="text-sm border rounded-lg px-2 py-1 flex-1 outline-none focus:ring-2 focus:ring-gray-300"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onEdit(val.trim() || cat.name); setEditing(false); }
                if (e.key === 'Escape') { setVal(cat.name); setEditing(false); }
              }}
            />
            <button onClick={() => { onEdit(val.trim() || cat.name); setEditing(false); }} className="text-green-600 hover:text-green-700">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setVal(cat.name); setEditing(false); }} className="text-gray-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-800">{cat.name}</span>
        )}
      </div>

      {/* Status badge */}
      <span className={cn(
        'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
        cat.isCustom ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500',
      )}>
        {cat.isCustom ? 'Custom' : 'System'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function AdminCategories() {
  const qc = useQueryClient();
  const [tab, setTab]               = useState('templates');
  const [businessType, setBizType]  = useState('');
  const [customBizType, setCustom]  = useState('');
  const [aiResult, setAiResult]     = useState(null);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [aiSource, setAiSource]     = useState('');
  // pending suggestion items (editable before accepting)
  const [pendingCats, setPendingCats]     = useState([]);
  const [pendingServices, setPendingServices] = useState([]);
  const [pendingTopics, setPendingTopics]     = useState([]);
  // selected client for applying suggestions
  const [targetClient, setTargetClient] = useState('global');
  // new category input
  const [newName, setNewName] = useState('');

  /* ── Queries ─────────────────────────────────────────────────── */
  const { data: globalCats, isLoading: catsLoading } = useQuery({
    queryKey: ['admin-global-cats'],
    queryFn: () => categoriesAPI.getAll().then((r) => r.data.data),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data.data ?? r.data),
  });

  /* ── Mutations ───────────────────────────────────────────────── */
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-global-cats'] }),
    onError: () => toast.error('Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-global-cats'] }); toast.success('Deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const createMut = useMutation({
    mutationFn: (data) => categoriesAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-global-cats'] }); setNewName(''); toast.success('Category added'); },
    onError: () => toast.error('Failed to create'),
  });

  const bulkMut = useMutation({
    mutationFn: (data) => categoriesAPI.bulkCreate(data),
    onSuccess: (res) => {
      const count = res.data?.count ?? 0;
      toast.success(`${count} categories added`);
      qc.invalidateQueries({ queryKey: ['admin-global-cats'] });
      setAiResult(null); setPendingCats([]); setPendingServices([]); setPendingTopics([]);
    },
    onError: () => toast.error('Failed to save categories'),
  });

  /* ── Reorder helpers ────────────────────────────────────────── */
  const cats = globalCats ?? [];

  async function move(cat, dir) {
    const idx = cats.findIndex((c) => c._id === cat._id);
    const target = dir === 'up' ? cats[idx - 1] : cats[idx + 1];
    if (!target) return;
    // swap sortOrders
    await Promise.all([
      categoriesAPI.update(cat._id, { sortOrder: target.sortOrder }),
      categoriesAPI.update(target._id, { sortOrder: cat.sortOrder }),
    ]);
    qc.invalidateQueries({ queryKey: ['admin-global-cats'] });
  }

  /* ── AI suggest ──────────────────────────────────────────────── */
  async function handleAISuggest() {
    const type = businessType === 'Other' ? customBizType : businessType;
    if (!type?.trim()) return toast.error('Enter a business type first');
    setLoadingAI(true);
    try {
      const res = await categoriesAPI.suggest({ businessType: type });
      const d   = res.data.data;
      setAiResult(d);
      setAiSource(res.data.source);
      setPendingCats([...d.categories]);
      setPendingServices([...d.services]);
      setPendingTopics([...d.topics]);
    } catch {
      toast.error('Failed to generate suggestions');
    } finally { setLoadingAI(false); }
  }

  /* ── Accept suggestions ──────────────────────────────────────── */
  function acceptSuggestions() {
    const allNames = [...pendingCats, ...pendingServices];
    if (allNames.length === 0) return toast.error('No categories selected');
    const clientId = targetClient === 'global' ? undefined : targetClient;
    bulkMut.mutate({ names: allNames, clientId });
  }

  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.data ?? []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage global templates and AI-powered category suggestions</p>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'templates', label: 'Templates', icon: Layers },
          { key: 'ai',        label: 'AI Suggest', icon: Sparkles },
          { key: 'clients',   label: 'Per Client', icon: Building2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TEMPLATES TAB
          ════════════════════════════════════════════════════════════ */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_80px_80px_60px] items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category Name</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order</span>
              <span />
            </div>

            {catsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : cats.length === 0 ? (
              <div className="py-14 text-center">
                <Layers className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No global categories yet. Use AI Suggest or add manually.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cats.map((cat, i) => (
                  <CategoryRow
                    key={cat._id}
                    cat={cat}
                    isFirst={i === 0}
                    isLast={i === cats.length - 1}
                    onEdit={(name) => updateMut.mutate({ id: cat._id, data: { name } })}
                    onDelete={() => toast(`Delete "${cat.name}"?`, {
                      description: 'This will remove it from the global template.',
                      action: { label: 'Delete', onClick: () => deleteMut.mutate(cat._id) },
                      cancel: { label: 'Cancel', onClick: () => {} },
                      duration: 8000,
                    })}
                    onMoveUp={() => move(cat, 'up')}
                    onMoveDown={() => move(cat, 'down')}
                  />
                ))}
              </div>
            )}

            {/* Add new */}
            <div className="border-t flex items-center gap-2 px-4 py-3 bg-gray-50">
              <Plus className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                placeholder="Add new global category…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMut.mutate({ name: newName.trim() })}
              />
              <Button
                size="sm"
                disabled={!newName.trim() || createMut.isPending}
                onClick={() => createMut.mutate({ name: newName.trim() })}
              >
                {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          AI SUGGEST TAB
          ════════════════════════════════════════════════════════════ */}
      {tab === 'ai' && (
        <div className="space-y-5">
          {/* Input card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <p className="text-sm font-bold text-gray-900">AI Category Suggestion</p>
                <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">
                  BETA
                </span>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Select value={businessType} onValueChange={setBizType}>
                  <SelectTrigger className="h-10 w-56">
                    <SelectValue placeholder="Select business type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                {businessType === 'Other' && (
                  <Input
                    className="h-10 w-48"
                    placeholder="e.g. Yoga Studio"
                    value={customBizType}
                    onChange={(e) => setCustom(e.target.value)}
                  />
                )}

                <Button
                  onClick={handleAISuggest}
                  disabled={loadingAI}
                  className="h-10 gap-2"
                >
                  {loadingAI
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                    : <><Sparkles className="h-4 w-4" /> Generate Suggestions</>
                  }
                </Button>

                {aiResult && (
                  <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => { setAiResult(null); setPendingCats([]); setPendingServices([]); setPendingTopics([]); }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI results */}
          {aiResult && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                {aiSource === 'ai' ? 'Generated by AI for' : 'Template suggestions for'}{' '}
                <strong className="text-gray-700">{businessType === 'Other' ? customBizType : businessType}</strong>
                <span className="text-gray-300 mx-1">·</span>
                <span className="text-xs text-gray-400">Edit pills below before accepting</span>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Categories */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Review Categories ({pendingCats.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 min-h-[60px]">
                      {pendingCats.map((c, i) => (
                        <Pill
                          key={i}
                          label={c}
                          color="blue"
                          onEdit={(v) => setPendingCats((prev) => prev.map((x, j) => j === i ? v : x))}
                          onRemove={() => setPendingCats((prev) => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                    {/* Add */}
                    <div className="mt-2 flex gap-1">
                      <AddPillInput onAdd={(v) => setPendingCats((p) => [...p, v])} placeholder="Add category…" />
                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Services ({pendingServices.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5 min-h-[60px]">
                      {pendingServices.map((s, i) => (
                        <Pill
                          key={i}
                          label={s}
                          color="green"
                          onEdit={(v) => setPendingServices((prev) => prev.map((x, j) => j === i ? v : x))}
                          onRemove={() => setPendingServices((prev) => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                    <div className="mt-2">
                      <AddPillInput onAdd={(v) => setPendingServices((p) => [...p, v])} placeholder="Add service…" />
                    </div>
                  </CardContent>
                </Card>

                {/* Review topics */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Review Topics ({pendingTopics.length}) <span className="text-gray-400 font-normal normal-case">(reference only)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 min-h-[60px]">
                      {pendingTopics.map((t, i) => (
                        <Pill
                          key={i}
                          label={t}
                          color="purple"
                          onEdit={(v) => setPendingTopics((prev) => prev.map((x, j) => j === i ? v : x))}
                          onRemove={() => setPendingTopics((prev) => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                    <div className="mt-2">
                      <AddPillInput onAdd={(v) => setPendingTopics((p) => [...p, v])} placeholder="Add topic…" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Accept bar */}
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-semibold text-gray-700 mb-0.5">Save to</p>
                    <Select value={targetClient} onValueChange={setTargetClient}>
                      <SelectTrigger className="h-9 w-56 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global Template (all clients)</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c._id} value={c._id}>{c.businessName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400">
                      {pendingCats.length + pendingServices.length} items will be created
                    </p>
                    <Button
                      onClick={acceptSuggestions}
                      disabled={bulkMut.isPending || (pendingCats.length + pendingServices.length === 0)}
                      className="gap-2"
                    >
                      {bulkMut.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                        : <><Check className="h-4 w-4" /> Accept &amp; Save</>
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          PER-CLIENT TAB
          ════════════════════════════════════════════════════════════ */}
      {tab === 'clients' && (
        <PerClientTab clients={clients} />
      )}
    </div>
  );
}

/* ── Inline add pill input ───────────────────────────────────── */
function AddPillInput({ onAdd, placeholder }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-1 w-full">
      <input
        className="text-xs flex-1 border rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-gray-300 bg-white"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }}
      />
      <button
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
        className="text-xs px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ── Per-client tab ──────────────────────────────────────────── */
function PerClientTab({ clients }) {
  const qc = useQueryClient();
  const [selectedClient, setSelectedClient] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-client-cats', selectedClient],
    queryFn: () => categoriesAPI.getAll({ clientId: selectedClient }).then((r) => r.data.data),
    enabled: !!selectedClient,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => categoriesAPI.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-client-cats', selectedClient] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-client-cats', selectedClient] }); toast.success('Deleted'); },
  });

  const createMut = useMutation({
    mutationFn: (name) => categoriesAPI.create({ name, clientId: selectedClient }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-client-cats', selectedClient] }),
  });

  const [newName, setNewName] = useState('');
  const cats = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="h-10 w-64">
            <SelectValue placeholder="Select a client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.businessName}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedClient && (
          <p className="text-sm text-gray-400">{cats.length} categories</p>
        )}
      </div>

      {!selectedClient ? (
        <div className="py-14 text-center">
          <Building2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select a client to view and edit their categories</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {cats.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No categories for this client yet</div>
            ) : cats.map((cat, i) => (
              <CategoryRow
                key={cat._id}
                cat={cat}
                isFirst={i === 0}
                isLast={i === cats.length - 1}
                onEdit={(name) => updateMut.mutate({ id: cat._id, payload: { name } })}
                onDelete={() => toast(`Delete "${cat.name}"?`, {
                  action: { label: 'Delete', onClick: () => deleteMut.mutate(cat._id) },
                  cancel: { label: 'Cancel', onClick: () => {} },
                  duration: 8000,
                })}
                onMoveUp={async () => {
                  const target = cats[i - 1];
                  if (!target) return;
                  await Promise.all([
                    categoriesAPI.update(cat._id, { sortOrder: target.sortOrder }),
                    categoriesAPI.update(target._id, { sortOrder: cat.sortOrder }),
                  ]);
                  qc.invalidateQueries({ queryKey: ['admin-client-cats', selectedClient] });
                }}
                onMoveDown={async () => {
                  const target = cats[i + 1];
                  if (!target) return;
                  await Promise.all([
                    categoriesAPI.update(cat._id, { sortOrder: target.sortOrder }),
                    categoriesAPI.update(target._id, { sortOrder: cat.sortOrder }),
                  ]);
                  qc.invalidateQueries({ queryKey: ['admin-client-cats', selectedClient] });
                }}
              />
            ))}
          </div>
          <div className="border-t flex items-center gap-2 px-4 py-3 bg-gray-50">
            <Plus className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              placeholder="Add category for this client…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMut.mutate(newName.trim())}
            />
            <Button size="sm" disabled={!newName.trim() || createMut.isPending} onClick={() => { createMut.mutate(newName.trim()); setNewName(''); }}>
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
