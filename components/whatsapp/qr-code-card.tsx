import { QRCodeSVG } from "qrcode.react";
import { Loader2, RefreshCw, QrCode, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WhatsAppStatus } from "@/lib/api";

interface QRCodeCardProps {
  qrCode: string | null;
  status: WhatsAppStatus | null;
  actionLoading: boolean;
  onReconnect: () => Promise<void>;
  onRefreshQR: () => void;
}

export function QRCodeCard({ qrCode, status, actionLoading, onReconnect, onRefreshQR }: QRCodeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" /> QR Code
        </CardTitle>
        <CardDescription>Scan dengan WhatsApp untuk login</CardDescription>
      </CardHeader>
      <CardContent>
        {qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG value={qrCode} size={200} level="M" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Buka WhatsApp di HP Anda</p>
              <p className="text-sm text-muted-foreground">
                Tap <strong>Settings</strong> {">"} <strong>Linked Devices</strong> {">"} <strong>Link a Device</strong>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefreshQR}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh QR
            </Button>
          </div>
        ) : status?.status === "connected" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-green-400" />
            <p className="text-muted-foreground">WhatsApp sudah terhubung</p>
          </div>
        ) : status?.status === "connecting" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="text-muted-foreground">Menghubungkan ke WhatsApp...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <QrCode className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground">QR code akan muncul setelah service terhubung</p>
            <Button onClick={onReconnect} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
