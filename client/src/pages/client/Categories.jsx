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
  { key: 'active', label: 'All Active' },
  { key: 'custom', label: 'Custom Only' },
];

export default function ClientCategories() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('active');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['client-categories'],
    queryFn: () => categoriesAPI.getAll().then((r) => r.data.data),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isEnabled }) => categoriesAPI.update(id, { isEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-categories'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-categories'] }); toast.success('Deleted'); },
  });

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await categoriesAPI.create({ name: newLabel.trim() });
      qc.invalidateQueries({ queryKey: ['client-categories'] });
      setNewLabel('');
      toast.success('Category added');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setAdding(false); }
  }

  const all = data ?? [];
  const categories = tab === 'custom' ? all.filter((c) => c.isCustom) : all.filter((c) => c.isEnabled);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage what customers can highlight in their reviews</p>
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
          <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No categories.</p>
        ) : (
          categories.map((cat, idx) => (
            <div
              key={cat._id}
              className={`flex items-center justify-between px-4 py-3 ${idx < categories.length - 1 ? 'border-b' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={cat.isEnabled}
                  onCheckedChange={(v) => toggleMut.mutate({ id: cat._id, isEnabled: v })}
                />
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <button
                onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMut.mutate(cat._id); }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}

        {/* Bottom add input */}
        <div className="border-t flex items-center gap-2 px-4 py-2">
          <Input
            placeholder="New category label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newLabel.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
