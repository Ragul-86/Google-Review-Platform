import { useState } from 'react';
import { reportsAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadBlob } from '@/lib/utils';

const TABS = ['Export Reviews', 'Export Feedback'];

export default function ClientReports() {
  const [tab, setTab] = useState('Export Reviews');
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = tab === 'Export Reviews'
        ? await reportsAPI.exportReviews({ type: 'all' })
        : await reportsAPI.exportFull();
      downloadBlob(
        res.data,
        res.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] ||
          `${tab === 'Export Reviews' ? 'reviews' : 'feedback'}-${Date.now()}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      toast.success('Downloaded!');
    } catch {
      toast.error('Export failed');
    } finally { setLoading(false); }
  }

  const isReviews = tab === 'Export Reviews';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Download spreadsheets of your reviews and feedback</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border rounded-lg p-1 w-fit bg-muted">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <Download className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-semibold text-base">
              {isReviews ? 'Export Reviews As XLSX' : 'Export Feedback As XLSX'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isReviews
                ? 'Downloads a spreadsheet of all reviews for your business.'
                : 'Downloads a spreadsheet of all private feedback tickets.'}
            </p>
          </div>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting…</> : 'Download'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
