/* =====================
 * AGENT
 * ===================== */
export interface Agent {
  id: number;
  name: string;
  email: string;
  online: boolean;
}

/* =====================
 * MESSAGE
 * ===================== */
export type MessageSender = "customer" | "agent";
export type MessageStatus = "sent" | "read";

export interface Message {
  id: number;
  text: string;
  sender: MessageSender;
  time: string;
  status?: MessageStatus;
}

/* =====================
 * CUSTOMER PROFILE
 * ===================== */
export interface CustomerProfile {
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  lastActive?: string;
}

/* =====================
 * CHAT
 * ===================== */
export type ChatChannel = "WhatsApp" | "Telegram" | "Email";
export type ChatMode = "bot" | "agent" | "paused" | "closed";

export interface Chat {
  id: number;
  name: string;
  channel: ChatChannel;
  online: boolean;
  unread: number;

  profile?: CustomerProfile;
  messages: Message[];

  /** admin only */
  mode?: ChatMode;
}
