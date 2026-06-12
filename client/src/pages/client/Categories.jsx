import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Loader2, Pencil, Check, X, ChevronUp, ChevronDown, LayoutList } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Category row ────────────────────────────────────────────── */
function CategoryRow({
  cat, isFirst, isLast,
  onToggle, onRename, onDelete, onMoveUp, onMoveDown,
  isUpdating,
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraft] = useState(cat.name);

  function saveEdit() {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    if (trimmed !== cat.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 group',
      !cat.isEnabled && 'bg-gray-50/70',
    )}>
      {/* Reorder arrows */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          title="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Toggle switch */}
      <Switch
        checked={cat.isEnabled}
        onCheckedChange={(v) => onToggle(v)}
        disabled={isUpdating}
        className="shrink-0"
      />

      {/* Name (editable) */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="text-sm flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-gray-300"
              value={draftName}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  saveEdit();
                if (e.key === 'Escape') { setDraft(cat.name); setEditing(false); }
              }}
            />
            <button onClick={saveEdit} className="p-1.5 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setDraft(cat.name); setEditing(false); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              'text-sm font-medium truncate',
              !cat.isEnabled ? 'text-gray-400' : 'text-gray-800',
            )}>
              {cat.name}
            </span>
            {/* Badges */}
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0',
              cat.isEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200',
            )}>
              {cat.isEnabled ? 'Active' : 'Off'}
            </span>
            {cat.isCustom && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                Custom
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons (edit + delete) */}
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => { setDraft(cat.name); setEditing(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Rename"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            disabled={isUpdating}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Delete"
          >
            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function ClientCategories() {
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding]    = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['client-categories'],
    queryFn: () => categoriesAPI.getAll().then((r) => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => categoriesAPI.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-categories'] }),
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-categories'] }); toast.success('Category deleted'); },
    onError: () => toast.error('Failed to delete category'),
  });

  async function handleAdd() {
    if (!newLabel.trim()) return toast.error('Enter a category name');
    setAdding(true);
    try {
      await categoriesAPI.create({ name: newLabel.trim() });
      qc.invalidateQueries({ queryKey: ['client-categories'] });
      setNewLabel('');
      toast.success('Category added');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add category');
    } finally { setAdding(false); }
  }

  function handleDelete(cat) {
    toast(`Delete "${cat.name}"?`, {
      description: 'This action cannot be undone.',
      action:  { label: 'Yes, Delete', onClick: () => deleteMut.mutate(cat._id) },
      cancel:  { label: 'Cancel',      onClick: () => {} },
      duration: 8000,
    });
  }

  /* Reorder helper — swap sortOrders with adjacent item */
  async function move(cats, cat, dir) {
    const idx    = cats.findIndex((c) => c._id === cat._id);
    const target = dir === 'up' ? cats[idx - 1] : cats[idx + 1];
    if (!target) return;
    await Promise.all([
      categoriesAPI.update(cat._id,    { sortOrder: target.sortOrder }),
      categoriesAPI.update(target._id, { sortOrder: cat.sortOrder }),
    ]);
    qc.invalidateQueries({ queryKey: ['client-categories'] });
  }

  const all     = data ?? [];
  const active  = all.filter((c) => c.isEnabled).length;
  const inactive = all.length - active;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage what customers can highlight in their reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
            {active} Active
          </span>
          {inactive > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full font-semibold">
              {inactive} Inactive
            </span>
          )}
        </div>
      </div>

      {/* Category list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-4 space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : all.length === 0 ? (
          <div className="py-14 text-center">
            <LayoutList className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No categories assigned yet.</p>
            <p className="text-xs text-gray-300 mt-1">Add a custom category below.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {all.map((cat, i) => (
              <CategoryRow
                key={cat._id}
                cat={cat}
                isFirst={i === 0}
                isLast={i === all.length - 1}
                isUpdating={deleteMut.isPending && deleteMut.variables === cat._id}
                onToggle={(v) => {
                  updateMut.mutate({ id: cat._id, payload: { isEnabled: v } });
                  toast.success(v ? `"${cat.name}" enabled` : `"${cat.name}" disabled`);
                }}
                onRename={(name) => {
                  updateMut.mutate({ id: cat._id, payload: { name } });
                  toast.success('Category renamed');
                }}
                onDelete={() => handleDelete(cat)}
                onMoveUp={() => move(all, cat, 'up')}
                onMoveDown={() => move(all, cat, 'down')}
              />
            ))}
          </div>
        )}

        {/* Add new */}
        <div className="border-t border-gray-100 flex items-center gap-2 px-4 py-3 bg-gray-50">
          <Plus className="h-4 w-4 text-gray-400 shrink-0" />
          <Input
            placeholder="Add a new category label…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-sm bg-transparent"
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newLabel.trim()}>
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
          </Button>
        </div>
      </div>

      {/* Help tip */}
      <p className="text-xs text-gray-400 leading-relaxed">
        <strong>Toggle</strong> to show/hide categories from customers without deleting them. &nbsp;
        <strong>Rename</strong> to customize what customers see (click the pencil icon). &nbsp;
        <strong>Reorder</strong> using the arrows to prioritize what matters most.
      </p>
    </div>
  );
}
