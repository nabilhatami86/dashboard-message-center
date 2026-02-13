import { Chat, Message, AdminChat } from "@/app/types/types";
import { ChatResponse, MessageResponse, AdminChatResponse } from "./api";

/* ------------------------------------------------------------------ */
/* Helper Types                                                        */
/* ------------------------------------------------------------------ */

type LegacyProfile = {
  phone?: string;
  email?: string;
  address?: string;
};

type LegacyChatExtras = {
  name?: string;
  unread?: number;
  profile?: LegacyProfile;
};

type LegacyMessageExtras = {
  time?: string;
  status?: Message["status"];
};

/* ------------------------------------------------------------------ */
/* Helper Functions                                                    */
/* ------------------------------------------------------------------ */

function pickFirst<T>(...values: Array<T | undefined | null>): T | undefined {
  return values.find((v): v is T => v !== undefined && v !== null);
}

/* ------------------------------------------------------------------ */
/* Transformers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Transform backend ChatResponse to frontend Chat type
 */
export function transformChatResponse(
  chat: ChatResponse & Partial<LegacyChatExtras>
): Chat {
  return {
    id: chat.id,
    name: pickFirst(chat.name, chat.customer_name, "Unknown")!,
    channel: chat.channel,
    online: chat.online,
    unread: pickFirst(chat.unread_count, chat.unread, 0)!,
    mode: chat.mode,

    profile: {
      phone: pickFirst(chat.profile?.phone, chat.customer_phone),
      email: pickFirst(chat.profile?.email, chat.customer_email),
      address: pickFirst(chat.profile?.address, chat.customer_address),
      lastActive: chat.online
        ? "Online"
        : formatLastActive(chat.last_message_at),
    },

    messages: (chat.messages ?? []).map(transformMessageResponse),

    // Ticket queue fields
    phone: chat.customer_phone,
    lastMessageAt: chat.last_message_at,
    assignedAgent: chat.assigned_agent,

    // Group information (for WhatsApp group chats)
    group_id: chat.group_id,
    group_name: chat.group_name,
  };
}

/**
 * Transform backend MessageResponse to frontend Message type
 */
export function transformMessageResponse(
  message: MessageResponse & Partial<LegacyMessageExtras>
): Message {
  return {
    id: message.id,
    text: message.text,
    sender: message.sender,
    time: pickFirst(message.time, formatTime(message.created_at))!,
    status: pickFirst(message.status, "sent"),
    // Media attachment fields
    media_url: message.media_url,
    media_type: message.media_type,
    media_filename: message.media_filename,
    // For group messages: info about who sent the message
    participant_phone: message.participant_phone,
    participant_name: message.participant_name,
  };
}

/**
 * Transform backend AdminChatResponse to frontend AdminChat type
 */
export function transformAdminChatResponse(
  adminChat: AdminChatResponse
): AdminChat {
  return {
    id: adminChat.id,
    mode: adminChat.mode,
    messages: adminChat.messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      time: msg.time,
      status: msg.status,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

/**
 * Format ISO datetime string to time string (HH:MM)
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format last active time
 */
function formatLastActive(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
