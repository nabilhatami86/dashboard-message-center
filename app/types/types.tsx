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
export type MessageSender = "customer" | "agent" | "admin";
export type MessageStatus = "sent" | "read";

export interface Message {
  id: number;
  text: string;
  sender: MessageSender;
  sender_name?: string;
  time: string;
  status?: MessageStatus;
  /** For group messages: info about who sent the message */
  participant_phone?: string | null;
  participant_name?: string | null;
}

/* =====================
 * ADMIN CHAT
 * ===================== */
export interface AdminChat {
  id: number;
  mode: "bot" | "manual";
  messages: Message[];
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

  /** ticket queue fields */
  phone?: string;
  lastMessageAt?: string;
  assignedAgent?: {
    id: number;
    name: string;
  } | null;

  /** group information (for WhatsApp group chats) */
  group_id?: string | null;
  group_name?: string | null;
}
