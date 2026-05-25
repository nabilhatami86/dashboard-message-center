# Dashboard Message Center — Dokumentasi Komponen

Dokumentasi ini menjelaskan komponen-komponen yang tersedia di project ini, cara pakainya, dan props yang diterima.

## Struktur Folder Komponen

```
components/
├── ui/           # Komponen shared — bisa dipakai di mana saja
├── admin/        # Komponen khusus halaman admin
├── agents/       # Komponen khusus halaman agent (queue, ticket)
├── chat/         # Komponen chat (list, window, input)
├── customer/     # Komponen detail customer
├── whatsapp/     # Komponen halaman koneksi WhatsApp
├── auth/         # Route guard dan auth initializer
└── providers/    # Context providers (tema, dll)
```

## Daftar Dokumen

| File | Isi |
|------|-----|
| [ui.md](./ui.md) | Komponen shared: Skeleton, ErrorAlert, EmptyState, StatCard, dll |
| [chat.md](./chat.md) | ChatList, ChatWindow, ChatWindowAgent, ShortcutManager, dll |
| [admin.md](./admin.md) | AdminDashboardHeader, CustomerChatsView, AgentPerformanceTable, dll |
| [agents.md](./agents.md) | TicketCard, QueueStatCards, AgentModal, DeleteConfirm, dll |
| [auth.md](./auth.md) | ProtectedRoute, AuthInitializer |
| [whatsapp.md](./whatsapp.md) | ConnectionStatusCard, QRCodeCard, WaInfoCard |

## Konvensi

- Semua komponen pakai `"use client"` karena project ini pakai Next.js App Router.
- Komponen di `ui/` bisa dipakai di mana saja tanpa batasan.
- Komponen di folder lain umumnya punya dependency ke data spesifik (tipe dari `@/app/types/types` atau `@/lib/api`).
- Skeleton loading biasanya diekspor bareng dari file yang sama dengan komponen utamanya.

## Import Path

Semua import pakai alias `@/`:
```tsx
import { ErrorAlert } from "@/components/ui/error-alert";
import { TicketCard } from "@/components/agents/ticket-card";
```
