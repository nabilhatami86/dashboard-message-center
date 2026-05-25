# UI Components

Komponen-komponen shared yang bisa dipakai di seluruh halaman.

---

## Skeleton

Placeholder loading dengan animasi pulse. Dipakai saat data belum selesai di-fetch.

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Pakai seperti div biasa, tentukan ukurannya lewat className
<Skeleton className="h-8 w-40" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-12 w-12 rounded-full" />  // avatar
```

---

## ErrorAlert

Banner error yang bisa di-dismiss. Cocok untuk error dari API.

```tsx
import { ErrorAlert } from "@/components/ui/error-alert";

const [error, setError] = useState<string | null>(null);

{error && (
  <ErrorAlert
    message={error}
    onDismiss={() => setError(null)}
    className="mb-4"
  />
)}
```

| Prop | Tipe | Wajib | Keterangan |
|------|------|-------|-----------|
| `message` | `string` | ✓ | Pesan error yang ditampilkan |
| `onDismiss` | `() => void` | - | Callback saat tombol X diklik |
| `className` | `string` | - | Tambahan class Tailwind |

---

## EmptyState

Tampilan kosong saat tidak ada data. Ada pilihan ikon bawaan.

```tsx
import EmptyState from "@/components/ui/empty-state";

<EmptyState
  icon="inbox"
  title="Tidak ada ticket"
  description="Belum ada ticket masuk. Tunggu sebentar."
/>

// Dengan action button
<EmptyState
  icon="message"
  title="Belum ada chat"
  action={<button onClick={refresh}>Refresh</button>}
/>
```

| Prop | Tipe | Default | Keterangan |
|------|------|---------|-----------|
| `icon` | `"message" \| "inbox" \| "user" \| "alert"` | `"message"` | Ikon yang ditampilkan |
| `title` | `string` | ✓ | Teks utama |
| `description` | `string` | - | Teks penjelasan di bawah title |
| `action` | `ReactNode` | - | Tombol atau elemen apapun |
| `className` | `string` | - | Tambahan class |

---

## LoadingState & ErrorState

Untuk state loading/error full-page (di tengah layar).

```tsx
import { LoadingState, ErrorState } from "@/components/ui/page-state";

// Loading
<LoadingState message="Memuat data..." submessage="Mohon tunggu" />

// Error dengan retry
<ErrorState
  message="Gagal memuat data"
  onRetry={() => window.location.reload()}
/>
```

| Komponen | Props |
|----------|-------|
| `LoadingState` | `message?: string`, `submessage?: string` |
| `ErrorState` | `message: string`, `onRetry?: () => void` |

---

## StatCard

Kartu statistik dengan ikon berwarna dan angka besar. Dipakai di halaman monitoring.

```tsx
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";
import { Users } from "lucide-react";

<StatCard
  icon={Users}
  title="Total Agents"
  value={12}
  color="blue"
  isVisible={true}
  delay={0}
/>

// Skeleton saat loading
<StatCardSkeleton />
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `icon` | `ComponentType` | Icon dari lucide-react |
| `title` | `string` | Label kartu |
| `value` | `string \| number` | Nilai yang ditampilkan besar |
| `color` | `"blue" \| "amber" \| "purple" \| "emerald"` | Warna ikon |
| `isVisible` | `boolean` | Trigger animasi fade-in |
| `delay` | `number` | Delay animasi dalam ms |

---

## StatusBadge & PriorityBadge

Badge untuk status ticket dan level prioritas.

```tsx
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";

<StatusBadge status="in_progress" />   // biru
<StatusBadge status="resolved" />     // hijau
<StatusBadge status="pending" />      // kuning

<PriorityBadge priority="high" />     // merah
<PriorityBadge priority="medium" />   // kuning
<PriorityBadge priority="low" />      // abu-abu
```

Status yang dikenali: `pending`, `assigned`, `in_progress`, `waiting_customer`, `resolved`, `closed`

Priority yang dikenali: `high`, `medium`, `low`

---

## ProgressBar, MetricCard, SummaryItem

Dipakai di halaman monitoring untuk visualisasi distribusi ticket.

```tsx
import { ProgressBar, MetricCard, SummaryItem } from "@/components/ui/progress-bar";
import { TrendingUp } from "lucide-react";

// Progress bar dengan label dan persentase
<ProgressBar
  label="Pending"
  value={24}
  percent={40}
  color="amber"
/>

// Kartu metrik tunggal (response time, dll)
<MetricCard
  icon={<TrendingUp className="w-5 h-5" />}
  title="Avg Response Time"
  value="2m 30s"
  subtitle="From creation to assignment"
  color="blue"
/>

// Item summary kecil di bawah progress bar
<SummaryItem label="Total" value={60} color="slate" />
```

---

## ToastNotification

Notifikasi sukses muncul di pojok kanan bawah.

```tsx
import { ToastNotification } from "@/components/ui/toast-notification";

const [toast, setToast] = useState("");

// Tampilkan notifikasi
setToast("Agent berhasil ditambahkan!");

// Render di JSX
{toast && <ToastNotification message={toast} />}
```

Toast akan tampil terus selama `message` ada isinya. Untuk auto-hide, pakai `setTimeout`:
```tsx
setToast("Berhasil!");
setTimeout(() => setToast(""), 3000);
```

---

## Badge

Badge serbaguna dengan beberapa varian.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Custom warna lewat className
<Badge className="bg-green-100 text-green-700 border-0">Aktif</Badge>
```

---

## Button

Button dengan varian dan ukuran.

```tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Hapus</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Kecil</Button>
<Button size="lg">Besar</Button>
<Button disabled>Disabled</Button>
```

---

## AgentSidebar

Sidebar untuk halaman agent. Sudah include navigasi tab, edit profil, logout, dan theme switcher.

```tsx
import AgentSidebar from "@/components/ui/agent-sidebar";

<AgentSidebar
  activeTab="customer"
  onTabChange={(tab) => {
    if (tab === "customer") router.push("/dashboard-agent");
    if (tab === "shortcuts") router.push("/shortcuts");
  }}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `activeTab` | `"customer" \| "admin" \| "shortcuts"` | Tab yang aktif sekarang |
| `onTabChange` | `(tab) => void` | Callback saat tab diklik |

---

## SimpleSidebar (app-sidebar)

Sidebar untuk halaman admin dengan navigasi ke monitoring, whatsapp, dan agents.

```tsx
import SimpleSidebar from "@/components/ui/app-sidebar";

// Simpel tanpa filter
<SimpleSidebar
  mobileOpen={mobileSidebarOpen}
  onMobileClose={closeMobileSidebar}
/>

// Dengan filter chat
<SimpleSidebar
  chats={chats}
  onSelectFilter={(filter) => setFilter(filter)}
  mobileOpen={mobileSidebarOpen}
  onMobileClose={closeMobileSidebar}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `chats` | `Chat[]` | Data chat untuk filter (opsional) |
| `onSelectFilter` | `(filter) => void` | Callback pilih filter |
| `mobileOpen` | `boolean` | Kontrol buka/tutup di mobile |
| `onMobileClose` | `() => void` | Callback saat overlay mobile diklik |

---

## ThemeSwitcher

Dropdown pilihan tema warna. Sudah terhubung ke Zustand store.

```tsx
import ThemeSwitcher from "@/components/ui/theme-switcher";

// Normal
<ThemeSwitcher />

// Mode compact (hanya ikon, tanpa label)
<ThemeSwitcher compact />
```
