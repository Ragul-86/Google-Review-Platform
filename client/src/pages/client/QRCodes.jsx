import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { qrcodesAPI } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Download, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SOURCES = ['Reception', 'Billing', 'Website', 'Packaging', 'Custom'];

export default function ClientQRCodes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [label, setLabel] = useState('');
  const [source, setSource] = useState('Reception');
  const [adding, setAdding] = useState(false);

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
      toast.success('QR code created!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setAdding(false); }
  }

  function downloadQR(id, title) {
    const svg = document.getElementById(`qr-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `qr-${title}.png`;
      a.href = canvas.toDataURL();
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }

  const qrCodes = data || [];
  const baseUrl = window.location.origin;
  const clientSlug = user?.client?.slug;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Codes</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate, download, and track QR codes per location</p>
      </div>

      {/* Generate form */}
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold mb-3">Generate new QR</p>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-48">
              <Label className="text-xs mb-1 block">Label</Label>
              <Input
                placeholder="Front desk"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR list */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : qrCodes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No QR codes yet. Create one above.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((qr) => {
            const url = `${baseUrl}/review/${clientSlug}?qr=${qr.token}`;
            return (
              <Card key={qr._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{qr.title}</p>
                      <span className="text-xs text-muted-foreground capitalize">{qr.source}</span>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => { toast(`Delete "${qr.title}"?`, { description: 'This cannot be undone.', action: { label: 'Delete', onClick: () => deleteMut.mutate(qr._id) }, cancel: { label: 'Cancel', onClick: () => {} }, duration: 8000 }); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-center my-3 p-3 bg-white rounded-xl">
                    <QRCodeSVG id={`qr-${qr._id}`} value={url} size={180} level="H" includeMargin />
                  </div>

                  <p className="text-xs text-muted-foreground text-center mb-3">Scans: <strong>{qr.scanCount}</strong></p>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { navigator.clipboard.writeText(url); toast.success('Copied!'); }}>
                      <Copy className="h-3 w-3 mr-1" /> Copy URL
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => downloadQR(qr._id, qr.title)}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
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
