# Admin Components

Komponen yang dipakai di halaman admin (`/dashboard-admin` dan `/dashboard-admin-monitoring`).

---

## AdminDashboardHeader

Header utama admin dengan tab Customer Chat / Internal Chat, tombol monitoring, dan logout.

```tsx
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";

<AdminDashboardHeader
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onMenuClick={toggleMobileSidebar}
  onMonitoring={() => router.push("/dashboard-admin-monitoring")}
  onLogout={() => { logout(); router.replace("/login"); }}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `activeTab` | `"customer" \| "agent"` | Tab yang aktif |
| `onTabChange` | `(tab) => void` | Callback ganti tab |
| `onMenuClick` | `() => void` | Buka sidebar mobile |
| `onMonitoring` | `() => void` | Navigasi ke halaman monitoring |
| `onLogout` | `() => void` | Logout |

---

## CustomerChatsView

Layout 3 kolom untuk customer chat: list chat kiri, jendela chat tengah, detail customer kanan.

```tsx
import { CustomerChatsView } from "@/components/admin/customer-chats-view";

<CustomerChatsView
  chats={chats}
  activeChatId={activeChatId}
  activeChat={activeChat}
  showCustomer={showCustomer}
  isSelectMode={isSelectMode}
  selectedChats={selectedChats}
  onSelectChat={(chat) => { setActiveChatId(chat.id); setShowCustomer(true); }}
  onDeleteChat={handleDeleteChat}
  onToggleSelectMode={handleToggleSelectMode}
  onToggleChatSelection={handleToggleChatSelection}
  onBulkDelete={handleBulkDelete}
  onSelectAll={handleSelectAll}
  onSendMessage={handleSendMessage}
  onAssignAgent={assignToAgent}
  onPauseChat={handlePauseChat}
  onCustomerMessage={(text) => handleCustomerMessage(activeChatId!, text)}
  onLoadChats={loadChats}
  onToggleCustomer={() => setShowCustomer(v => !v)}
  onCloseCustomer={() => setShowCustomer(false)}
  onBack={() => setActiveChatId(null)}
/>
```

Komponen ini menggabungkan `ChatList` + `ChatWindow` + `CustomerDetail`. State tetap dikelola di page, komponen ini hanya menerima props dan callback.

---

## AgentChatsView

Layout 2 kolom untuk internal chat admin-agent: list agent kiri, jendela chat kanan.

```tsx
import { AgentChatsView } from "@/components/admin/agent-chats-view";

<AgentChatsView
  agents={agents}
  activeAgentId={activeAgentId}
  activeAgent={activeAgent}
  adminChat={adminChat}
  onSelectAgent={(agent) => setActiveAgentId(agent.id)}
  onSendMessage={handleSendAdminMessage}
  onModeChange={handleModeChange}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `agents` | `AgentUser[]` | List agent |
| `activeAgentId` | `number \| null` | Agent yang dipilih |
| `activeAgent` | `AgentUser \| undefined` | Data agent aktif |
| `adminChat` | `AdminChat` | Data percakapan |
| `onSelectAgent` | `(agent) => void` | Pilih agent |
| `onSendMessage` | `(text) => Promise<void>` | Kirim pesan ke agent |
| `onModeChange` | `(mode) => Promise<void>` | Ganti mode bot/manual |

---

## AgentPerformanceTable

Tabel performa agent di halaman monitoring. Klik "View Tickets" untuk filter ticket per agent.

```tsx
import { AgentPerformanceTable } from "@/components/admin/agent-performance-table";

<AgentPerformanceTable
  agents={agents}
  tickets={tickets}
  selectedAgent={selectedAgent}
  onSelectAgent={setSelectedAgent}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `agents` | `AgentUser[]` | List semua agent |
| `tickets` | `TicketResponse[]` | Semua ticket (untuk hitung statistik) |
| `selectedAgent` | `number \| null` | Agent yang sedang difilter |
| `onSelectAgent` | `(id: number \| null) => void` | Pilih / batal pilih agent |

Kolom yang ditampilkan: Agent, Status (online/offline), Active, In Progress, Resolved, Actions.

---

## TicketListTable

Tabel daftar ticket. Bisa dipakai langsung atau sudah difilter berdasarkan agent.

```tsx
import { TicketListTable } from "@/components/admin/ticket-list-table";

// Semua ticket
<TicketListTable tickets={tickets} title="All Tickets" />

// Sudah difilter
<TicketListTable
  tickets={tickets.filter(t => t.assigned_agent_id === selectedAgent)}
  title={`Tickets for ${agentName}`}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `tickets` | `TicketResponse[]` | Data ticket |
| `title` | `string` | Judul tabel |

Kolom: ID, Customer, Status, Priority, Agent, Created. Maksimal 20 baris ditampilkan.
