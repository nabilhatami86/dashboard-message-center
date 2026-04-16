// API Base URL - sesuaikan dengan backend Python Anda
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =====================
// AUTH API
// =====================
export interface LoginResponse {
  message: string;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    phone?: string;
    role: "admin" | "agent";
  };
  access_token: string;
  token_type: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  username: string;
  role: "admin";
  online?: boolean;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: username, // Backend expects 'identifier' field
      password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Login error:", errorData);
    throw new Error(errorData.detail || "Login failed");
  }

  return response.json();
}

// Panggil backend logout (set agent offline di server)
export async function logoutAgent(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // abaikan error saat logout
  }
}

// =====================
// CHAT API
// =====================
export interface ChatResponse {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  channel: "WhatsApp" | "Telegram" | "Email";
  mode: "bot" | "agent" | "paused" | "closed";
  online: boolean;
  unread_count: number;
  assigned_agent_id?: number;
  assigned_agent?: {
    id: number;
    name: string;
  } | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages: MessageResponse[];
  // Group information (for WhatsApp group chats)
  group_id?: string | null;
  group_name?: string | null;
}

export interface MessageResponse {
  id: number;
  chat_id: number;
  text: string;
  sender: "customer" | "agent" | "admin";
  status: "sent" | "read";
  agent_id?: number;
  created_at: string;
  // Media attachment fields
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
  // For group messages: info about who sent the message
  participant_phone?: string | null;
  participant_name?: string | null;
}

export async function getChats(token: string): Promise<ChatResponse[]> {
  const response = await fetch(`${API_BASE_URL}/chats/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chats");
  }

  const chatList = await response.json();

  // Fetch detailed messages for each chat
  const chatsWithMessages = await Promise.all(
    chatList.map(async (chat: { id: number }) => {
      try {
        const detailedChat = await getChatById(chat.id, token);
        // Chat was deleted/closed - skip it
        if (!detailedChat) {
          return null;
        }
        return detailedChat;
      } catch (error) {
        console.error(`Failed to fetch messages for chat ${chat.id}:`, error);
        // Return chat without messages if detail fetch fails
        return { ...chat, messages: [] };
      }
    })
  );

  // Filter out null (deleted chats)
  return chatsWithMessages.filter((chat): chat is ChatResponse => chat !== null);
}

export async function getChatById(
  chatId: number,
  token?: string
): Promise<ChatResponse | null> {
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    headers,
  });

  // Handle 404 gracefully - chat might have been deleted/closed
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch chat");
  }

  return response.json();
}

export interface SendMessageRequest {
  chat_id: number;
  text: string;
  sender: "customer" | "agent";
  agent_id?: number;
  // Media attachment fields
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
}

export async function sendMessage(
  data: SendMessageRequest,
  token: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/chats/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

export async function markAsRead(chatId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/read`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to mark as read");
  }
}

export async function deleteChat(chatId: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete chat");
  }
}

export async function updateChatMode(
  chatId: number,
  mode: "bot" | "agent" | "paused" | "closed",
  token: string,
  assignedAgentId?: number
): Promise<ChatResponse> {
  const body: Record<string, unknown> = { mode };
  if (assignedAgentId !== undefined) body.assigned_agent_id = assignedAgentId;
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Failed to update chat mode");
  }

  return response.json();
}

export async function updateMessage(
  messageId: number,
  newText: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chats/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: newText }),
  });

  if (!response.ok) {
    throw new Error("Failed to update message");
  }
}

export async function deleteMessage(
  messageId: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chats/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete message");
  }
}

// =====================
// FILE UPLOAD API
// =====================
export interface UploadResponse {
  media_url: string;
  media_type: string;
  media_filename: string;
}

export async function uploadFile(
  file: File,
  token: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/chats/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to upload file");
  }

  return response.json();
}

// =====================
// ADMIN CHAT API (Internal Communication)
// =====================
export interface AdminChatResponse {
  id: number;
  mode: "bot" | "manual";
  messages: AdminMessageResponse[];
}

export interface AdminMessageResponse {
  id: number;
  text: string;
  sender: "agent" | "admin";
  time: string;
  status: "sent" | "read";
  sender_name?: string;
}

// Get admin chat messages from backend
export async function getAdminChat(
  agentId: number
): Promise<AdminChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin-chat/${agentId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch admin chat from backend");
      return {
        id: agentId,
        mode: "bot",
        messages: [],
      };
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching admin chat:", error);
    return {
      id: agentId,
      mode: "bot",
      messages: [],
    };
  }
}

export async function sendAdminMessage(
  agentId: number,
  text: string,
  senderName: string,
  sender: "agent" | "admin" = "agent",
  mode: "bot" | "manual" = "bot"
): Promise<AdminMessageResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin-chat/${agentId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          sender,
          sender_name: senderName,
          mode,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send admin message");
    }

    return response.json();
  } catch (error) {
    console.error("Error sending admin message:", error);
    throw error;
  }
}

// =====================
// ADMIN/AGENT LIST API
// =====================
export async function getAdminList(token: string): Promise<AdminUser[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/admins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch admin list from backend, using mock data");
      // Fallback ke mock data jika endpoint belum ada
      return getMockAdminList();
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching admin list:", error);
    // Fallback ke mock data
    return getMockAdminList();
  }
}

export interface AgentUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  username: string;
  role: "agent";
  display_name?: string;
  status?: string;
  is_available?: boolean;
  online?: boolean;
}

export async function getAgentList(token: string): Promise<AgentUser[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/agents`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch agent list from backend, using mock data");
      return getMockAgentList();
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching agent list:", error);
    return getMockAgentList();
  }
}

function getMockAgentList(): AgentUser[] {
  return [
    {
      id: 2,
      name: "Agent User",
      email: "agent@example.com",
      phone: "081234567890",
      username: "agent",
      role: "agent",
      online: true,
    },
  ];
}

// Mock admin list untuk development
function getMockAdminList(): AdminUser[] {
  return [
    {
      id: 1,
      name: "Admin Utama",
      email: "admin@example.com",
      phone: "087731624016",
      username: "admin",
      role: "admin",
      online: true,
    },
    {
      id: 2,
      name: "Admin Support",
      email: "support@example.com",
      phone: "087731624016",
      username: "admin_support",
      role: "admin",
      online: false,
    },
  ];
}

// =====================
// TICKET QUEUE API (Simple FIFO Queue System)
// =====================

// Get available tickets (unassigned chats) from the queue
export async function getAvailableTickets(token: string): Promise<ChatResponse[]> {
  const response = await fetch(`${API_BASE_URL}/chats/queue/available`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch available tickets");
  }

  // Backend now returns full ChatResponse with messages included
  return response.json();
}

// Claim a ticket from the queue
export async function claimTicketFromQueue(
  chatId: number,
  token: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/claim`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to claim ticket");
  }

  return response.json();
}

// =====================
// TICKET & QUEUE API
// =====================
export interface TicketResponse {
  id: number;
  chat_id: number;
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "waiting_customer"
    | "resolved"
    | "escalated"
    | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_agent_id?: number;
  created_at: string;
  assigned_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  notes?: string;
  tags?: string;
  customer_name?: string;
  customer_phone?: string;
  agent_name?: string;
}

export interface TicketStatsResponse {
  total_pending: number;
  total_assigned: number;
  total_in_progress: number;
  total_waiting_customer: number;
  total_resolved_today: number;
  total_resolved: number;
  total_escalated: number;
  avg_wait_time_seconds?: number;
  avg_resolution_time_seconds?: number;
}

export interface AgentProfileResponse {
  id: number;
  user_id: number;
  display_name: string;
  signature?: string;
  status: "online" | "offline" | "busy" | "break";
  is_available: boolean;
  max_concurrent_tickets: number;
  expertise_tags?: string;
  priority_score: number;
  last_activity_at?: string;
  total_tickets_handled: number;
  total_tickets_resolved: number;
  average_response_time_seconds?: number;
  average_resolution_time_seconds?: number;
}

// Get pending tickets (queue)
export async function getPendingTickets(
  token: string,
  limit: number = 50
): Promise<TicketResponse[]> {
  const response = await fetch(`${API_BASE_URL}/tickets/queue?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pending tickets");
  }

  return response.json();
}

// Get my tickets (for agents)
export async function getMyTickets(
  token: string,
  status?: string
): Promise<TicketResponse[]> {
  const url = status
    ? `${API_BASE_URL}/tickets/my-tickets?status=${status}`
    : `${API_BASE_URL}/tickets/my-tickets`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch my tickets");
  }

  return response.json();
}

// Get all tickets (admin only)
export async function getAllTickets(
  token: string,
  status?: string,
  priority?: string,
  limit: number = 100
): Promise<TicketResponse[]> {
  let url = `${API_BASE_URL}/tickets/all?limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (priority) url += `&priority=${priority}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch all tickets");
  }

  return response.json();
}

// Get ticket by ID
export async function getTicketById(
  ticketId: number,
  token: string
): Promise<TicketResponse> {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ticket");
  }

  return response.json();
}

// Agent claims ticket from queue
export async function claimTicket(
  ticketId: number,
  token: string
): Promise<{ status: string; message: string; ticket: TicketResponse }> {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/claim`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to claim ticket");
  }

  return response.json();
}

// Manually assign ticket (admin only)
export async function assignTicket(
  ticketId: number,
  agentId: number,
  token: string,
  reason?: string
): Promise<{ status: string; message: string; ticket: TicketResponse }> {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ agent_id: agentId, reason }),
  });

  if (!response.ok) {
    throw new Error("Failed to assign ticket");
  }

  return response.json();
}

// Update ticket status
export async function updateTicketStatus(
  ticketId: number,
  status: TicketResponse["status"],
  token: string
): Promise<{ status: string; message: string; ticket: TicketResponse }> {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update ticket status");
  }

  return response.json();
}

// Resolve ticket
export async function resolveTicket(
  ticketId: number,
  token: string
): Promise<{ status: string; message: string; ticket: TicketResponse }> {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to resolve ticket");
  }

  return response.json();
}

// =====================
// AGENT STATUS & HEARTBEAT
// =====================

// Update status agent (online/offline/busy/break)
export async function updateAgentStatus(
  token: string,
  status: "online" | "offline" | "busy" | "break",
  isAvailable: boolean
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/agent/chats/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, is_available: isAvailable }),
    });
  } catch {
    // silently ignore
  }
}

// Kirim heartbeat untuk menjaga status online tetap aktif
export async function sendAgentHeartbeat(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/agent/chats/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // silently ignore
  }
}

// Set offline saat tab ditutup (keepalive agar request tetap terkirim saat page unload)
export function setAgentOfflineBeacon(token: string): void {
  try {
    fetch(`${API_BASE_URL}/agent/chats/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "offline", is_available: false }),
      keepalive: true,
    });
  } catch {
    // silently ignore
  }
}

// =====================
// ONLINE AGENTS (for transfer)
// =====================
export interface OnlineAgent {
  agent_id: number;
  name: string;
  display_name: string;
  status: string;
  is_available: boolean;
}

export async function getOnlineAgents(token: string): Promise<OnlineAgent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/online-agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

// Transfer ticket ke agent lain (by chat_id)
export async function transferTicketByChat(
  chatId: number,
  toAgentId: number,
  token: string,
  reason?: string
): Promise<{ status: string; message: string; ticket: TicketResponse }> {
  const response = await fetch(
    `${API_BASE_URL}/tickets/transfer-by-chat/${chatId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to_agent_id: toAgentId, reason }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to transfer ticket");
  }

  return response.json();
}

// Get ticket statistics
export async function getTicketStats(
  token: string
): Promise<TicketStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/tickets/stats/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ticket stats");
  }

  return response.json();
}

// =====================
// AGENT MANAGEMENT (Admin & Agent self)
// =====================

export async function createAgent(token: string, data: {
  name: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  display_name?: string;
}): Promise<AgentUser> {
  const res = await fetch(`${API_BASE_URL}/users/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal membuat agent");
  }
  return res.json();
}

export async function updateAgentFull(token: string, userId: number, data: {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  display_name?: string;
}): Promise<AgentUser> {
  const res = await fetch(`${API_BASE_URL}/users/agents/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal mengupdate agent");
  }
  return res.json();
}

export async function deleteAgentById(token: string, userId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/agents/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal menghapus agent");
  }
}

export async function updateMyTag(token: string, displayName: string): Promise<{ message: string; display_name: string }> {
  const res = await fetch(`${API_BASE_URL}/users/agents/me/tag`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal mengupdate tag");
  }
  return res.json();
}

// Get agent profile
export async function getAgentProfile(
  agentId: number,
  token: string
): Promise<AgentProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/agents/${agentId}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch agent profile");
  }

  return response.json();
}

// =====================
// WHATSAPP BAILEYS API
// =====================
const BAILEYS_URL = process.env.NEXT_PUBLIC_BAILEYS_URL || "http://localhost:3000";

export interface WhatsAppStatus {
  status: "disconnected" | "connecting" | "connected" | "qr_ready";
  user: {
    id: string;
    name: string;
    phone: string;
  } | null;
  hasQR: boolean;
  qrTimestamp: number | null;
  lastError: string | null;
}

export interface WhatsAppQR {
  qrCode: string;
  timestamp: number;
  expiresIn: number;
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await fetch(`${BAILEYS_URL}/wa/status`);

  if (!response.ok) {
    throw new Error("Failed to fetch WhatsApp status");
  }

  return response.json();
}

export async function getWhatsAppQR(): Promise<WhatsAppQR> {
  const response = await fetch(`${BAILEYS_URL}/wa/qr`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "QR code not available");
  }

  return response.json();
}

export async function reconnectWhatsApp(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BAILEYS_URL}/wa/reconnect`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to reconnect WhatsApp");
  }

  return response.json();
}

export async function logoutWhatsApp(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BAILEYS_URL}/wa/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to logout WhatsApp");
  }

  return response.json();
}

// =====================
// SHORTCUT MESSAGE API
// =====================
export interface ShortcutMessageResponse {
  id: number;
  key: string;
  values: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export async function getShortcuts(token: string): Promise<ShortcutMessageResponse[]> {
  const response = await fetch(`${API_BASE_URL}/shortcuts/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shortcuts");
  }

  return response.json();
}

export async function searchShortcuts(
  query: string,
  token: string
): Promise<ShortcutMessageResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/shortcuts/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search shortcuts");
  }

  return response.json();
}

export async function createShortcut(
  data: { key: string; values: string },
  token: string
): Promise<ShortcutMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/shortcuts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create shortcut");
  }

  return response.json();
}

export async function updateShortcut(
  shortcutId: number,
  data: { key?: string; values?: string },
  token: string
): Promise<ShortcutMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/shortcuts/${shortcutId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update shortcut");
  }

  return response.json();
}

export async function duplicateShortcut(
  shortcutId: number,
  token: string
): Promise<ShortcutMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/shortcuts/${shortcutId}/duplicate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to duplicate shortcut");
  }

  return response.json();
}

export async function deleteShortcut(
  shortcutId: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/shortcuts/${shortcutId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete shortcut");
  }
}

// =====================
// HELPER FUNCTIONS
// =====================
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getUserData(): LoginResponse["data"] | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("user_data");
  return data ? JSON.parse(data) : null;
}

export function setAuthData(data: LoginResponse): void {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_data", JSON.stringify(data.data));
}

export function clearAuthData(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_data");
}
