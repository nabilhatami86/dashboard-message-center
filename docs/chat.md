# Chat Components

Komponen untuk tampilan chat: list percakapan, jendela chat, dan input.

---

## ChatList

Daftar chat yang bisa diklik, dilengkapi search dan mode seleksi massal (bulk delete).

```tsx
import ChatList from "@/components/chat/chat-list";

<ChatList
  chats={chats}
  activeChatId={activeChatId}
  onSelectChat={(chat) => setActiveChatId(chat.id)}
  onDeleteChat={handleDelete}
  isSelectMode={isSelectMode}
  selectedChats={selectedChats}
  onToggleSelectMode={() => setIsSelectMode(!isSelectMode)}
  onToggleChatSelection={(id) => toggleSelected(id)}
  onBulkDelete={handleBulkDelete}
  onSelectAll={handleSelectAll}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `chats` | `Chat[]` | Data chat yang ditampilkan |
| `activeChatId` | `number \| null` | ID chat yang sedang aktif |
| `onSelectChat` | `(chat: Chat) => void` | Klik chat |
| `onDeleteChat` | `(id: number) => void` | Hapus satu chat |
| `isSelectMode` | `boolean` | Mode centang massal aktif/tidak |
| `selectedChats` | `Set<number>` | Set ID yang sudah dicentang |
| `onToggleSelectMode` | `() => void` | Toggle mode seleksi |
| `onToggleChatSelection` | `(id: number) => void` | Centang/uncentang satu chat |
| `onBulkDelete` | `() => void` | Hapus semua yang dicentang |
| `onSelectAll` | `() => void` | Centang semua / uncentang semua |

---

## ChatWindow

Jendela chat lengkap untuk admin. Support kirim pesan, media, shortcuts (`/`), transfer ticket, dan typing indicator.

```tsx
import ChatWindow from "@/components/chat/chat-window";

<ChatWindow
  chat={activeChat}
  onSendMessage={handleSendMessage}
  onAssignAgent={assignToAgent}
  onPauseChat={handlePauseChat}
  onCustomerMessage={(text) => handleCustomerMessage(activeChatId, text)}
  onLoadChats={loadChats}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `chat` | `Chat` | Data chat yang sedang dibuka |
| `onSendMessage` | `(text, media?) => void` | Kirim pesan sebagai agent |
| `onAssignAgent` | `() => void` | Assign agent ke chat ini |
| `onPauseChat` | `(mode: ChatMode) => void` | Ganti mode (paused/agent/closed) |
| `onCustomerMessage` | `(text) => void` | Simulasi pesan dari customer (admin only) |
| `onLoadChats` | `() => void` | Refresh list chat setelah ada perubahan |
| `onTransferTicket` | `(toAgentId, reason) => Promise<void>` | Transfer ticket ke agent lain |
| `onToggleCustomer` | `() => void` | Toggle panel detail customer |
| `onOpenCustomer` | `() => void` | Buka panel detail customer |

**Fitur bawaan:**
- Tekan `/` di input untuk buka shortcut picker
- Draft pesan tersimpan per-chat di memory
- Typing indicator real-time via WebSocket
- Upload file/gambar
- Reply dan preview media

---

## ChatWindowAgent

Versi ChatWindow yang lebih simpel untuk agent. Tidak ada simulasi customer message atau transfer ticket.

```tsx
import ChatWindowAgent from "@/components/chat/chat-window-agent";

<ChatWindowAgent
  chat={chat}
  onSendMessage={handleSendMessage}
  onEndChat={(mode) => handleEndChat(mode)}
  onOpenCustomer={() => setShowCustomer(true)}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `chat` | `Chat` | Data chat aktif |
| `onSendMessage` | `(text, media?) => void` | Kirim pesan |
| `onEndChat` | `(mode: ChatMode) => void` | Akhiri / pause chat |
| `onOpenCustomer` | `() => void` | Buka panel detail customer |

---

## AgentList

Daftar agent dengan indikator online. Dipakai di tab "Internal Chat" admin.

```tsx
import AgentList from "@/components/chat/agent-list";

<AgentList
  agents={agents}
  activeAgentId={activeAgentId}
  onSelectAgent={(agent) => setActiveAgentId(agent.id)}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `agents` | `AgentUser[]` | List agent dari API |
| `activeAgentId` | `number \| null` | Agent yang sedang dipilih |
| `onSelectAgent` | `(agent: AgentUser) => void` | Callback pilih agent |

---

## AdminAgentChatWindow

Chat antara admin dan agent spesifik. Ada toggle bot/manual mode.

```tsx
import AdminAgentChatWindow from "@/components/chat/admin-agent-chat-window";

<AdminAgentChatWindow
  agent={activeAgent}
  adminChat={adminChat}
  onSendMessage={handleSendAdminMessage}
  onModeChange={(mode) => setAdminChat(prev => ({ ...prev, mode }))}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `agent` | `AgentUser` | Agent yang diajak chat |
| `adminChat` | `AdminChat` | Data percakapan admin-agent |
| `onSendMessage` | `(text: string) => void` | Kirim pesan |
| `onModeChange` | `(mode: "bot" \| "manual") => void` | Ganti mode chat |

---

## ShortcutManager

Halaman manajemen shortcut message. Bisa create/edit/delete shortcut.

```tsx
import ShortcutManager from "@/components/chat/shortcut-manager";

// Bisa langsung dirender, tidak butuh props
<ShortcutManager />
```

Shortcut bisa dipanggil di ChatWindow dengan mengetik `/` di kolom pesan.

---

## CustomerDetail

Panel samping yang menampilkan info lengkap customer dan tombol ubah prioritas.

```tsx
import CustomerDetail from "@/components/customer/customer-detail";

<CustomerDetail
  chat={activeChat}
  onClose={() => setShowCustomer(false)}
  onUpdatePriority={(priority) => handleUpdatePriority(priority)}
/>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `chat` | `Chat` | Data chat / customer |
| `onClose` | `() => void` | Tutup panel |
| `onUpdatePriority` | `(priority) => void` | Ubah prioritas ticket |
