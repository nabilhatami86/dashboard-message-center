"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  getWhatsAppStatus,
  getWhatsAppQR,
  reconnectWhatsApp,
  logoutWhatsApp,
  WhatsAppStatus,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  RefreshCw,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function WhatsAppSettingsPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const data = await getWhatsAppStatus();
      setStatus(data);
      setError(null);

      // Jika ada QR, fetch QR code
      if (data.hasQR && data.status === "qr_ready") {
        try {
          const qrData = await getWhatsAppQR();
          setQrCode(qrData.qrCode);
        } catch {
          // QR might not be ready yet
        }
      } else {
        setQrCode(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to WhatsApp service");
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling untuk status
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(fetchStatus, 3000); // Poll setiap 3 detik

    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle reconnect
  const handleReconnect = async () => {
    setActionLoading(true);
    try {
      await reconnectWhatsApp();
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reconnect");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin logout dari WhatsApp? Anda perlu scan QR ulang.")) {
      return;
    }

    setActionLoading(true);
    try {
      await logoutWhatsApp();
      setQrCode(null);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout");
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge
  const getStatusBadge = () => {
    if (!status) return null;

    switch (status.status) {
      case "connected":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "qr_ready":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <QrCode className="w-3 h-3 mr-1" />
            Scan QR Code
          </Badge>
        );
      case "connecting":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading WhatsApp status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="w-6 h-6" />
          WhatsApp Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola koneksi WhatsApp untuk menerima dan mengirim pesan
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Pastikan Baileys service berjalan di port 3000
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connection Status</span>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>Status koneksi WhatsApp saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            {status?.status === "connected" && status.user ? (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Reconnect
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    disabled={actionLoading}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
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
                      {status?.status === "qr_ready"
                        ? "Scan QR code untuk login"
                        : "WhatsApp service tidak terhubung"}
                    </p>
                  </div>
                </div>

                {status?.status !== "qr_ready" && (
                  <Button onClick={handleReconnect} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Connect WhatsApp
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code
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
                  <p className="text-sm text-muted-foreground">
                    Buka WhatsApp di HP Anda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tap <strong>Settings</strong> {">"} <strong>Linked Devices</strong> {">"}{" "}
                    <strong>Link a Device</strong>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchStatus}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh QR
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
                <p className="text-muted-foreground">
                  QR code akan muncul setelah service terhubung
                </p>
                <Button onClick={handleReconnect} disabled={actionLoading}>
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Generate QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informasi</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>WhatsApp akan tetap terhubung selama service berjalan</li>
            <li>Jika QR code expired, klik &quot;Refresh QR&quot; untuk generate QR baru</li>
            <li>Logout akan menghapus session dan memerlukan scan QR ulang</li>
            <li>
              Pastikan Baileys service berjalan di{" "}
              <code className="px-1 py-0.5 bg-muted rounded">localhost:3001</code>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
