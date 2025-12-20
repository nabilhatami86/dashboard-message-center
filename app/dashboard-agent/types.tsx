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
 * (dipakai di CustomerDetail)
 * ===================== */

export interface CustomerProfile {
  phone?: string;
  email?: string;
  address?: string;
  lastActive?: string;
}

/* =====================
 * CHAT (AGENT VIEW)
 * ===================== */

export type ChatChannel = "WhatsApp" | "Telegram" | "Email";

export interface Chat {
  id: number;
  name: string;
  channel: ChatChannel;
  online: boolean;
  unread: number;

  /** data customer (opsional tapi disiapkan) */
  profile?: CustomerProfile;

  /** isi percakapan */
  messages: Message[];
}
