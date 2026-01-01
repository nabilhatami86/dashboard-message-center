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
    role: "admin" | "agent";
  };
  access_token: string;
  token_type: string;
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

// =====================
// ADMIN CHAT API (Internal Communication)
// =====================
export interface AdminChatResponse {
  id: number;
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

// Untuk sementara menggunakan localStorage sampai backend support admin chat
export async function getAdminChat(agentId: number): Promise<AdminChatResponse> {
  // TODO: Implement backend endpoint untuk admin chat
  const stored = localStorage.getItem(`admin_chat_${agentId}`);
  if (stored) {
    return JSON.parse(stored);
  }

  return {
    id: agentId,
    messages: [],
  };
}

export async function sendAdminMessage(
  agentId: number,
  text: string,
  senderName: string
): Promise<AdminMessageResponse> {
  // TODO: Implement backend endpoint untuk admin chat
  const chat = await getAdminChat(agentId);

  const newMessage: AdminMessageResponse = {
    id: Date.now(),
    text,
    sender: "agent",
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "sent",
    sender_name: senderName,
  };

  chat.messages.push(newMessage);
  localStorage.setItem(`admin_chat_${agentId}`, JSON.stringify(chat));

  return newMessage;
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
