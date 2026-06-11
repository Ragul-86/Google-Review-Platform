import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: '', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

export default function ClientFeedback() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['client-feedback', tab],
    queryFn: () => feedbackAPI.getAll({ status: tab, limit: 50 }).then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }) => feedbackAPI.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-feedback'] }); toast.success('Status updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => feedbackAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-feedback'] }); toast.success('Deleted'); },
  });

  const feedbacks = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Feedback Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">Private feedback from 1–3 star ratings</p>
      </div>

      {/* Filter tabs */}
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

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : feedbacks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No feedback tickets.</p>
      ) : (
        <div className="space-y-2">
          {feedbacks.map((f) => (
            <Card key={f._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{f.customerName}</span>
                      <StarRow rating={f.rating} />
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{f.status?.replace('_', ' ')}</span>
                    </div>
                    {(f.customerEmail || f.customerPhone) && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {f.customerEmail}{f.customerPhone && ` · ${f.customerPhone}`}
                      </p>
                    )}
                    <p className="text-sm">{f.message || f.feedback}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={f.status} onValueChange={(v) => updateMut.mutate({ id: f._id, status: v })}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => { if (window.confirm('Delete?')) deleteMut.mutate(f._id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
