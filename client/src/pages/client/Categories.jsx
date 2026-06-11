import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: 'all',    label: 'All Categories' },
  { key: 'custom', label: 'Custom Only' },
];

export default function ClientCategories() {
  const qc = useQueryClient();
  const [tab, setTab]         = useState('all');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding]   = useState(false);

  /* ── Query ─────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['client-categories'],
    queryFn: () => categoriesAPI.getAll().then((r) => r.data.data),
  });

  /* ── Mutations ──────────────────────────────────────────────── */
  const toggleMut = useMutation({
    mutationFn: ({ id, isEnabled }) => categoriesAPI.update(id, { isEnabled }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['client-categories'] });
      toast.success(vars.isEnabled ? 'Category enabled' : 'Category disabled');
    },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });

  /* ── Add ────────────────────────────────────────────────────── */
  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await categoriesAPI.create({ name: newLabel.trim() });
      qc.invalidateQueries({ queryKey: ['client-categories'] });
      setNewLabel('');
      toast.success('Category added');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add category');
    } finally {
      setAdding(false);
    }
  }

  /* ── Delete with confirmation ────────────────────────────────── */
  function handleDelete(cat) {
    if (window.confirm(`Delete "${cat.name}"?\n\nThis cannot be undone.`)) {
      deleteMut.mutate(cat._id);
    }
  }

  /* ── Filter logic (toggle never deletes — just hides from active view) ── */
  const all = data ?? [];
  const categories = tab === 'custom' ? all.filter((c) => c.isCustom) : all;

  const activeCount   = all.filter((c) => c.isEnabled).length;
  const inactiveCount = all.filter((c) => !c.isEnabled).length;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage what customers can highlight in their reviews
          </p>
        </div>
        {/* Summary badges */}
        <div className="flex gap-2 shrink-0">
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
            {activeCount} Active
          </span>
          {inactiveCount > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-full font-medium">
              {inactiveCount} Inactive
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border rounded-lg p-1 w-fit bg-muted">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              tab === t.key
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category list */}
      <div className="border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {tab === 'custom' ? 'No custom categories yet.' : 'No categories found.'}
          </p>
        ) : (
          categories.map((cat, idx) => (
            <div
              key={cat._id}
              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                !cat.isEnabled ? 'bg-gray-50/60' : ''
              } ${idx < categories.length - 1 ? 'border-b' : ''}`}
            >
              {/* Left: toggle + name + badge */}
              <div className="flex items-center gap-3 min-w-0">
                <Switch
                  checked={cat.isEnabled}
                  onCheckedChange={(v) => toggleMut.mutate({ id: cat._id, isEnabled: v })}
                  disabled={toggleMut.isPending}
                />
                <span className={`text-sm font-medium truncate ${!cat.isEnabled ? 'text-muted-foreground' : ''}`}>
                  {cat.name}
                </span>
                {/* Status badge */}
                <span
                  className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                    cat.isEnabled
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {cat.isEnabled ? 'Active' : 'Inactive'}
                </span>
                {cat.isCustom && (
                  <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    Custom
                  </span>
                )}
              </div>

              {/* Right: delete button */}
              <button
                onClick={() => handleDelete(cat)}
                disabled={deleteMut.isPending}
                className="shrink-0 ml-3 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                title="Delete category"
              >
                {deleteMut.isPending && deleteMut.variables === cat._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}

        {/* Add new category */}
        <div className="border-t flex items-center gap-2 px-4 py-2 bg-muted/30">
          <Input
            placeholder="New category label…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-sm bg-transparent"
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newLabel.trim()}>
            {adding
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Plus className="h-4 w-4 mr-1" />Add</>}
          </Button>
        </div>
      </div>

      {/* Helper note */}
      <p className="text-xs text-muted-foreground">
        💡 Toggle the switch to <strong>enable or disable</strong> a category — disabled categories
        are hidden from customers but not deleted. Use the trash icon to permanently delete.
      </p>
    </div>
  );
}
