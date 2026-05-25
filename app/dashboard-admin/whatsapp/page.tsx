"use client";

import { useEffect, useState, useCallback } from "react";
import { getWhatsAppStatus, getWhatsAppQR, reconnectWhatsApp, logoutWhatsApp, WhatsAppStatus } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ConnectionStatusCard } from "@/components/whatsapp/connection-status-card";
import { QRCodeCard } from "@/components/whatsapp/qr-code-card";
import { WaInfoCard } from "@/components/whatsapp/wa-info-card";
import AdminTopBar from "@/components/ui/admin-top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone } from "lucide-react";

export default function WhatsAppSettingsPage() {
  const [status, setStatus]               = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode]               = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getWhatsAppStatus();
      setStatus(data);
      setError(null);

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

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

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

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin logout dari WhatsApp? Anda perlu scan QR ulang.")) return;
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

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <AdminTopBar
          title="WhatsApp Settings"
          subtitle="Kelola koneksi WhatsApp"
          icon={<Smartphone className="h-4 w-4" />}
          showBack
          backHref="/dashboard-admin"
        />
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border rounded-xl p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
            <div className="border rounded-xl p-6 space-y-4 flex flex-col items-center">
              <Skeleton className="h-5 w-24 self-start" />
              <Skeleton className="h-52 w-52 rounded-lg" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AdminTopBar
        title="WhatsApp Settings"
        subtitle="Kelola koneksi WhatsApp"
        icon={<Smartphone className="h-4 w-4" />}
        showBack
        backHref="/dashboard-admin"
      />

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {error && (
          <ErrorAlert
            message={`${error} — Pastikan Baileys service berjalan di port 3000`}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <ConnectionStatusCard
            status={status}
            actionLoading={actionLoading}
            onReconnect={handleReconnect}
            onLogout={handleLogout}
          />
          <QRCodeCard
            qrCode={qrCode}
            status={status}
            actionLoading={actionLoading}
            onReconnect={handleReconnect}
            onRefreshQR={fetchStatus}
          />
        </div>

        <WaInfoCard />
      </div>
    </div>
  );
}
