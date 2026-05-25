import { Loader2, RefreshCw, LogOut, Wifi, WifiOff, CheckCircle2, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WhatsAppStatus } from "@/lib/api";

function getStatusBadge(status?: WhatsAppStatus) {
  switch (status?.status) {
    case "connected":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
        </Badge>
      );
    case "qr_ready":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <QrCode className="w-3 h-3 mr-1" /> Scan QR Code
        </Badge>
      );
    case "connecting":
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting...
        </Badge>
      );
    default:
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Disconnected
        </Badge>
      );
  }
}

interface ConnectionStatusCardProps {
  status: WhatsAppStatus | null;
  actionLoading: boolean;
  onReconnect: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function ConnectionStatusCard({ status, actionLoading, onReconnect, onLogout }: ConnectionStatusCardProps) {
  const isConnected = status?.status === "connected";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Connection Status</span>
          {getStatusBadge(status ?? undefined)}
        </CardTitle>
        <CardDescription>Status koneksi WhatsApp saat ini</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected && status?.user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="font-medium">{status.user.name}</p>
                <p className="text-sm text-muted-foreground">+{status.user.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onReconnect} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Reconnect
              </Button>
              <Button variant="destructive" size="sm" onClick={onLogout} disabled={actionLoading}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Tidak terhubung</p>
                <p className="text-sm text-muted-foreground">
                  {status?.status === "qr_ready" ? "Scan QR code untuk login" : "WhatsApp service tidak terhubung"}
                </p>
              </div>
            </div>
            {status?.status !== "qr_ready" && (
              <Button onClick={onReconnect} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Connect WhatsApp
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
