import { Chat, Message, AdminChat } from "@/app/types/types";
import { ChatResponse, MessageResponse, AdminChatResponse } from "./api";

/**
 * Transform backend ChatResponse to frontend Chat type
 */
export function transformChatResponse(chat: ChatResponse): Chat {
  return {
    id: chat.id,
    name: (chat as any).name || chat.customer_name || "Unknown",
    channel: chat.channel,
    online: chat.online,
    unread: chat.unread_count || (chat as any).unread || 0,
    mode: chat.mode,
    profile: {
      phone: (chat as any).profile?.phone || chat.customer_phone,
      email: (chat as any).profile?.email || chat.customer_email,
      address: (chat as any).profile?.address || chat.customer_address,
      lastActive: chat.online ? "Online" : formatLastActive(chat.last_message_at),
    },
    messages: (chat.messages || []).map(transformMessageResponse),
  };
}

/**
 * Transform backend MessageResponse to frontend Message type
 */
export function transformMessageResponse(message: MessageResponse): Message {
  return {
    id: message.id,
    text: message.text,
    sender: message.sender,
    time: (message as any).time || formatTime(message.created_at),
    status: message.status || (message as any).status || "sent",
  };
}

/**
 * Transform backend AdminChatResponse to frontend AdminChat type
 */
export function transformAdminChatResponse(adminChat: AdminChatResponse): AdminChat {
  return {
    id: adminChat.id,
    messages: adminChat.messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      time: msg.time,
      status: msg.status,
    })),
  };
}

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
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
