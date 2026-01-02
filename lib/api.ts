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

export async function login(username: string, password: string): Promise<LoginResponse> {
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
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages: MessageResponse[];
}

export interface MessageResponse {
  id: number;
  chat_id: number;
  text: string;
  sender: "customer" | "agent" | "admin";
  status: "sent" | "read";
  agent_id?: number;
  created_at: string;
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
    chatList.map(async (chat: any) => {
      try {
        const detailedChat = await getChatById(chat.id, token);
        return detailedChat;
      } catch (error) {
        console.error(`Failed to fetch messages for chat ${chat.id}:`, error);
        // Return chat without messages if detail fetch fails
        return { ...chat, messages: [] };
      }
    })
  );

  return chatsWithMessages;
}

export async function getChatById(chatId: number, token?: string): Promise<ChatResponse> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    headers
  });

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

export async function updateMessage(messageId: number, newText: string, token: string): Promise<void> {
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

export async function deleteMessage(messageId: number, token: string): Promise<void> {
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
export async function getAdminChat(agentId: number): Promise<AdminChatResponse> {
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
    const response = await fetch(`${API_BASE_URL}/admin-chat/${agentId}/messages`, {
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
    });

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
