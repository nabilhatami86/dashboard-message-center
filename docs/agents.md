# Agent Components

Komponen untuk halaman agent: queue ticket, manajemen agent, dan statistik harian.

---

## TicketCard

Kartu satu ticket di queue. Tampilkan info customer, waktu tunggu, pesan terakhir, dan tombol claim.

```tsx
import { TicketCard, TicketCardSkeleton, QueueStatCardSkeleton } from "@/components/agents/ticket-card";

// Render ticket
<TicketCard
  ticket={ticket}
  index={0}
  claiming={claiming === ticket.id}
  onClaim={(chatId) => handleClaim(chatId)}
/>

// Skeleton loading
<TicketCardSkeleton />
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `ticket` | `Chat` | Data ticket/chat dari queue |
| `index` | `number` | Posisi di list (0 = badge "#1 ANTRIAN") |
| `claiming` | `boolean` | `true` saat proses claim sedang berlangsung |
| `onClaim` | `(chatId: number) => void` | Callback tombol "AMBIL SEKARANG" |

Ticket dengan `priority === "high"` otomatis dapat badge merah "HIGH PRIORITY" di pojok atas.

---

## QueueStatCards

4 kartu statistik di halaman queue: pending, nama agent, status online, dan progress harian.

```tsx
import { QueueStatCards } from "@/components/agents/queue-stat-cards";

<QueueStatCards
  ticketCount={availableTickets.length}
  userName={user?.name || "Agent"}
  dailyStats={dailyStats}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `ticketCount` | `number` | Jumlah ticket yang sedang di queue |
| `userName` | `string` | Nama agent yang login |
| `dailyStats` | `AgentDailyStats \| null` | Data dari API `/daily-stats`, `null` saat loading |

`AgentDailyStats` punya field `resolved_today` (angka) dan `date`. Progress bar menghitung persentase dari target 20 ticket/hari.

---

## QueueInfoBox

Kotak informasi statis tentang cara kerja queue (FIFO, auto-refresh, dll). Tidak butuh props.

```tsx
import { QueueInfoBox } from "@/components/agents/queue-info-box";

<QueueInfoBox />
```

---

## AgentModal

Modal form untuk tambah atau edit agent. Validasi form ada di dalam komponen.

```tsx
import { AgentModal, emptyAgentForm } from "@/components/agents/agent-modal";
import type { AgentFormData } from "@/components/agents/agent-modal";

const [showModal, setShowModal] = useState(false);
const [editTarget, setEditTarget] = useState<AgentUser | null>(null);

// Buka untuk buat agent baru
<button onClick={() => { setEditTarget(null); setShowModal(true); }}>
  Tambah Agent
</button>

// Buka untuk edit
<button onClick={() => { setEditTarget(agent); setShowModal(true); }}>
  Edit
</button>

// Render modal
{showModal && (
  <AgentModal
    mode={editTarget ? "edit" : "create"}
    initial={editTarget ?? undefined}
    onClose={() => setShowModal(false)}
    onSave={async (data) => {
      await saveAgent(data);
      setShowModal(false);
    }}
  />
)}
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `mode` | `"create" \| "edit"` | Mode form |
| `initial` | `AgentUser` | Data awal saat edit (opsional) |
| `onClose` | `() => void` | Tutup modal |
| `onSave` | `(data: AgentFormData) => Promise<void>` | Submit form |

**`AgentFormData`** punya field: `name`, `email`, `username`, `password`, `phone`, `display_name`.

Password hanya wajib diisi saat mode `"create"`. Mode `"edit"` kosongkan password = tidak diubah.

---

## DeleteConfirm

Dialog konfirmasi hapus agent. Tampilkan nama agent sebelum konfirmasi.

```tsx
import { DeleteConfirm } from "@/components/agents/delete-confirm";

{showDeleteConfirm && (
  <DeleteConfirm
    agent={targetAgent}
    onClose={() => setShowDeleteConfirm(false)}
    onConfirm={async () => {
      await deleteAgent(targetAgent.id);
      setShowDeleteConfirm(false);
    }}
  />
)}
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `agent` | `AgentUser` | Agent yang akan dihapus |
| `onClose` | `() => void` | Batalkan |
| `onConfirm` | `() => Promise<void>` | Konfirmasi hapus |

---

## AgentStatusBadge

Badge status agent: online (hijau), offline (abu), busy (kuning), break (biru).

```tsx
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";

<AgentStatusBadge status={agent.status} />
// status: "online" | "offline" | "busy" | "break"
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `status` | `string` | Status agent dari API |
