import { useState } from 'react';
import { reportsAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadBlob } from '@/lib/utils';

function ExportCard({ title, description, onExport, loading }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onExport} disabled={loading} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting…</> : <><Download className="h-4 w-4 mr-2" /> Download XLSX</>}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminReports() {
  const [reviewType, setReviewType] = useState('all');
  const [loadingState, setLoadingState] = useState({});

  async function handleExport(type, fn) {
    setLoadingState((s) => ({ ...s, [type]: true }));
    try {
      const res = await fn();
      downloadBlob(
        res.data,
        res.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || `${type}-${Date.now()}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      toast.success('Downloaded successfully!');
    } catch {
      toast.error('Export failed. Try again.');
    } finally {
      setLoadingState((s) => ({ ...s, [type]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Export data as Excel spreadsheets" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Reviews Export</CardTitle>
            </div>
            <CardDescription>Export all positive/negative reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Review Type</Label>
              <Select value={reviewType} onValueChange={setReviewType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="positive">Positive Only</SelectItem>
                  <SelectItem value="negative">Negative Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => handleExport('reviews', () => reportsAPI.exportReviews({ type: reviewType }))}
              disabled={loadingState.reviews}
              className="w-full"
            >
              {loadingState.reviews ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting…</> : <><Download className="h-4 w-4 mr-2" /> Download</>}
            </Button>
          </CardContent>
        </Card>

        <ExportCard
          title="Feedback Export"
          description="Export all private customer feedback"
          loading={loadingState.feedback}
          onExport={() => handleExport('feedback', () => reportsAPI.exportFeedback())}
        />

        <ExportCard
          title="Full Report"
          description="Export all reviews + feedback in one file (2 sheets)"
          loading={loadingState.full}
          onExport={() => handleExport('full', () => reportsAPI.exportFull())}
        />
      </div>
    </div>
  );
}
