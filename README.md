# dashboard-message-center

Frontend dashboard untuk sistem customer service WhatsApp. Dibangun dengan Next.js 14 App Router + TypeScript + Tailwind CSS.

---

## Daftar Isi

1. [Apa ini?](#1-apa-ini)
2. [Struktur Folder](#2-struktur-folder)
3. [Cara Menjalankan](#3-cara-menjalankan)
4. [Environment Variables](#4-environment-variables)
5. [Halaman yang Tersedia](#5-halaman-yang-tersedia)
6. [State Management](#6-state-management)
7. [Dokumentasi Komponen](#7-dokumentasi-komponen)

---

## 1. Apa ini?

Dashboard ini dipakai oleh dua jenis pengguna:
- **Admin** — pantau semua chat, kelola agent, lihat monitoring
- **Agent** — handle chat customer, ambil tiket dari antrian, kirim pesan ke WhatsApp

Frontend berkomunikasi dengan `backend-dashboard-python` via REST API dan WebSocket untuk update real-time.

---

## 2. Struktur Folder

```
dashboard-message-center/
├── app/
│   ├── page.tsx                        # Root redirect ke login atau dashboard
│   ├── login/page.tsx                  # Halaman login
│   ├── dashboard-admin/
│   │   ├── page.tsx                    # Dashboard utama admin (chat + agent list)
│   │   ├── agents/page.tsx             # Manajemen agent
│   │   └── whatsapp/page.tsx           # Status koneksi WhatsApp
│   ├── dashboard-agent/
│   │   └── page.tsx                    # Dashboard agent (chat window)
│   ├── dashboard-agent-queue/
│   │   └── page.tsx                    # Antrian tiket untuk agent
│   └── dashboard-admin-monitoring/
│       └── page.tsx                    # Monitoring performa agent
├── components/
│   ├── ui/                             # Komponen shadcn/ui (Button, Dialog, dll)
│   ├── shared/                         # Komponen umum (Skeleton, StatusBadge, dll)
│   ├── chat/                           # ChatList, ChatWindow, ShortcutManager
│   ├── admin/                          # Header, ChatsView, AgentPerformanceTable
│   ├── agents/                         # TicketCard, QueueStatCards, AgentModal
│   ├── auth/                           # ProtectedRoute, AuthInitializer
│   └── whatsapp/                       # ConnectionStatusCard, QRCodeCard
├── lib/
│   ├── api.ts                          # Semua fungsi fetch ke backend
│   └── utils.ts                        # Helper (cn, format, dll)
├── store/
│   └── authStore.ts                    # Zustand store untuk auth state
├── docs/                               # Dokumentasi komponen
└── public/
```

---

## 3. Cara Menjalankan

### Install dependencies

```bash
npm install
```

### Jalankan development server

```bash
npm run dev
```

Buka `http://localhost:3001` di browser (port 3001 supaya tidak bentrok dengan wa-baileys-service di 3000).

### Build production

```bash
npm run build
npm start
```

---

## 4. Environment Variables

Buat file `.env.local` di root folder `dashboard-message-center/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Sesuaikan dengan URL backend yang berjalan.

---

## 5. Halaman yang Tersedia

| Path | Role | Keterangan |
|------|------|------------|
| `/login` | Semua | Halaman login |
| `/dashboard-admin` | Admin | Chat customer + list agent |
| `/dashboard-admin/agents` | Admin | Kelola agent (tambah, edit, hapus) |
| `/dashboard-admin/whatsapp` | Admin | Status koneksi WA + QR code |
| `/dashboard-admin-monitoring` | Admin | Statistik dan performa agent |
| `/dashboard-agent` | Agent | Chat window agent |
| `/dashboard-agent-queue` | Agent | Antrian tiket (self-claim) |

Semua halaman dilindungi `ProtectedRoute` — redirect ke `/login` jika belum login.

---

## 6. State Management

Pakai **Zustand** untuk auth state global (`store/authStore.ts`).

Yang disimpan di store:
- `user` — data user yang login (id, name, role)
- `token` — JWT token
- `isAuthenticated` — status login
- `login(token, user)` — set state setelah login berhasil
- `logout()` — clear state + redirect

Token disimpan di `localStorage` dan dibaca ulang saat halaman reload via `AuthInitializer`.

---

## 7. Dokumentasi Komponen

Detail props dan cara pakai tiap komponen ada di folder [`docs/`](./docs/):

| File | Isi |
|------|-----|
| [`docs/README.md`](./docs/README.md) | Index + konvensi umum |
| [`docs/ui.md`](./docs/ui.md) | Komponen UI shared (Skeleton, Badge, Modal, dll) |
| [`docs/chat.md`](./docs/chat.md) | ChatList, ChatWindow, ShortcutManager, CustomerDetail |
| [`docs/admin.md`](./docs/admin.md) | Header, ChatsView, AgentChatsView, PerformanceTable |
| [`docs/agents.md`](./docs/agents.md) | TicketCard, QueueStatCards, AgentModal, AgentStatusBadge |
| [`docs/auth.md`](./docs/auth.md) | ProtectedRoute, AuthInitializer, useAuthStore |
| [`docs/whatsapp.md`](./docs/whatsapp.md) | ConnectionStatusCard, QRCodeCard, WaInfoCard |
