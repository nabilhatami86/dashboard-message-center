# WhatsApp Components

Komponen untuk halaman koneksi WhatsApp (`/dashboard-admin/whatsapp`).

---

## ConnectionStatusCard

Kartu yang menampilkan status koneksi WhatsApp saat ini. Ada tombol reconnect dan logout WA.

```tsx
import { ConnectionStatusCard } from "@/components/whatsapp/connection-status-card";

<ConnectionStatusCard
  status={waStatus}
  actionLoading={actionLoading}
  onReconnect={async () => {
    setActionLoading(true);
    await reconnectWA();
    setActionLoading(false);
  }}
  onLogout={async () => {
    setActionLoading(true);
    await logoutWA();
    setActionLoading(false);
  }}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `status` | `WhatsAppStatus \| null` | Status dari API, `null` saat loading |
| `actionLoading` | `boolean` | `true` saat reconnect/logout sedang proses |
| `onReconnect` | `() => Promise<void>` | Tombol reconnect |
| `onLogout` | `() => Promise<void>` | Logout dari WhatsApp |

**`WhatsAppStatus`** punya field `state` yang bisa berupa: `"connected"`, `"disconnected"`, `"qr_required"`, dll.

---

## QRCodeCard

Kartu QR code untuk scan login WhatsApp. Tampil otomatis saat status butuh QR.

```tsx
import { QRCodeCard } from "@/components/whatsapp/qr-code-card";

<QRCodeCard
  qrCode={waStatus?.qr_code ?? null}
  status={waStatus}
  actionLoading={actionLoading}
  onReconnect={handleReconnect}
  onRefreshQR={() => fetchStatus()}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `qrCode` | `string \| null` | String QR code dari API (bisa SVG atau base64) |
| `status` | `WhatsAppStatus \| null` | Status WA |
| `actionLoading` | `boolean` | Status loading |
| `onReconnect` | `() => Promise<void>` | Tombol reconnect |
| `onRefreshQR` | `() => void` | Refresh QR code |

---

## WaInfoCard

Kartu informasi statis tentang cara setup dan cara pakai koneksi WhatsApp Baileys. Tidak butuh props.

```tsx
import { WaInfoCard } from "@/components/whatsapp/wa-info-card";

<WaInfoCard />
```

---

## Contoh pemakaian lengkap (halaman whatsapp)

```tsx
"use client";

import { useEffect, useState } from "react";
import { ConnectionStatusCard } from "@/components/whatsapp/connection-status-card";
import { QRCodeCard } from "@/components/whatsapp/qr-code-card";
import { WaInfoCard } from "@/components/whatsapp/wa-info-card";
import { getWhatsAppStatus, reconnectWhatsApp, logoutWhatsApp } from "@/lib/api";

export default function WhatsAppPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    const data = await getWhatsAppStatus(token);
    setStatus(data);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ConnectionStatusCard
        status={status}
        actionLoading={loading}
        onReconnect={async () => { setLoading(true); await reconnectWhatsApp(token); setLoading(false); }}
        onLogout={async () => { setLoading(true); await logoutWhatsApp(token); setLoading(false); }}
      />

      {status?.state !== "connected" && (
        <QRCodeCard
          qrCode={status?.qr_code ?? null}
          status={status}
          actionLoading={loading}
          onReconnect={async () => { setLoading(true); await reconnectWhatsApp(token); setLoading(false); }}
          onRefreshQR={fetchStatus}
        />
      )}

      <WaInfoCard />
    </div>
  );
}
```
