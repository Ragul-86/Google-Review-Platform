import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { qrcodesAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Download, Copy, Loader2, QrCode, ExternalLink, Check, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SOURCES = ['Reception', 'Billing', 'Website', 'Packaging', 'Custom'];

const SOURCE_COLORS = {
  reception: 'bg-blue-50 text-blue-700 border-blue-200',
  billing:   'bg-green-50 text-green-700 border-green-200',
  website:   'bg-purple-50 text-purple-700 border-purple-200',
  packaging: 'bg-orange-50 text-orange-700 border-orange-200',
  custom:    'bg-gray-100 text-gray-600 border-gray-200',
};

export default function ClientQRCodes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [label, setLabel]   = useState('');
  const [source, setSource] = useState('Reception');
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopied] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['client-qrcodes'],
    queryFn: () => qrcodesAPI.getAll().then((r) => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => qrcodesAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-qrcodes'] }); toast.success('QR code deleted'); },
  });

  async function handleCreate() {
    if (!label.trim()) return toast.error('Label is required');
    setAdding(true);
    try {
      await qrcodesAPI.create({ title: label.trim(), source: source.toLowerCase() });
      qc.invalidateQueries({ queryKey: ['client-qrcodes'] });
      setLabel('');
      toast.success(`QR code "${label.trim()}" created!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create QR code');
    } finally { setAdding(false); }
  }

  /* ── PNG download ───────────────────────────────────────────── */
  function downloadPNG(id, title) {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  /* ── SVG download ───────────────────────────────────────────── */
  function downloadSVG(id, title) {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    a.href     = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Copy URL ───────────────────────────────────────────────── */
  function copyURL(url, id) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      toast.success('Review link copied!');
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const qrCodes  = data || [];
  const baseUrl  = window.location.origin;
  const clientSlug = user?.client?.slug;

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        subtitle="Generate and track QR codes for each business location or touchpoint"
      />

      {/* ── Generate form ─────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-bold text-gray-900 mb-4">Generate New QR Code</p>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-gray-500 font-semibold mb-1.5 block">Label</Label>
              <Input
                placeholder="e.g. Front Desk, Table 1"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="h-10"
              />
            </div>
            <div className="w-40">
              <Label className="text-xs text-gray-500 font-semibold mb-1.5 block">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={adding} className="h-10 gap-2 px-5">
              {adding
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Plus className="h-4 w-4" /> Generate</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── QR summary ────────────────────────────────────────────── */}
      {!isLoading && qrCodes.length > 0 && (
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            <strong className="text-gray-900">{qrCodes.length}</strong> QR code{qrCodes.length !== 1 ? 's' : ''} · Total scans:{' '}
            <strong className="text-gray-900">{qrCodes.reduce((s, q) => s + (q.scanCount || 0), 0)}</strong>
          </span>
        </div>
      )}

      {/* ── QR list ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[420px] rounded-xl" />)}
        </div>
      ) : qrCodes.length === 0 ? (
        <Card className="border-0 shadow-sm border-dashed">
          <CardContent className="py-16 text-center space-y-2">
            <QrCode className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="font-medium text-gray-400">No QR codes yet</p>
            <p className="text-sm text-gray-300">Generate your first QR code above and place it at customer touchpoints.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((qr) => {
            const url = `${baseUrl}/review/${clientSlug}?qr=${qr.token}`;
            const srcKey = (qr.source || 'custom').toLowerCase();
            const srcColor = SOURCE_COLORS[srcKey] ?? SOURCE_COLORS.custom;
            const isCopied = copiedId === qr._id;

            return (
              <Card key={qr._id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-0">
                  {/* Card header */}
                  <div className="flex items-start justify-between p-4 pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{qr.title}</p>
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block capitalize', srcColor)}>
                        {qr.source || 'Custom'}
                      </span>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0 ml-2"
                      onClick={() => toast(`Delete "${qr.title}"?`, {
                        description: 'This QR code will stop working.',
                        action: { label: 'Delete', onClick: () => deleteMut.mutate(qr._id) },
                        cancel: { label: 'Cancel', onClick: () => {} },
                        duration: 8000,
                      })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* QR code display */}
                  <div className="mx-4 mb-3 flex justify-center bg-white rounded-xl p-4 border border-gray-100 group-hover:border-gray-200 transition-colors">
                    <QRCodeSVG
                      id={`qr-${qr._id}`}
                      value={url}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Scan count */}
                  <div className="flex justify-center mb-3">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{qr.scanCount || 0}</span>
                      <span className="text-xs text-gray-400">scan{qr.scanCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 space-y-2">
                    {/* Copy URL — full width */}
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-9 text-xs gap-2 font-semibold transition-all',
                        isCopied
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'hover:border-primary/50 hover:text-primary',
                      )}
                      onClick={() => copyURL(url, qr._id)}
                    >
                      {isCopied
                        ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                        : <><Copy className="h-3.5 w-3.5" /> Copy Review Link</>
                      }
                    </Button>
                    {/* Download row */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="h-9 text-xs gap-1.5 font-medium hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => downloadPNG(qr._id, qr.title)}
                      >
                        <FileImage className="h-3.5 w-3.5" />
                        PNG
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 text-xs gap-1.5 font-medium hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50"
                        onClick={() => downloadSVG(qr._id, qr.title)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        SVG
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
