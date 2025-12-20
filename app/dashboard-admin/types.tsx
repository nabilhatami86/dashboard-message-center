export type CustomerProfile = {
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  lastActive?: string;
};

export type Message = {
  id: number;
  text: string;
  sender: "customer" | "agent";
  time: string;
  status?: "sent" | "read";
};

export type Chat = {
  id: number;
  name: string;
  channel: "WhatsApp" | "Telegram" | "Email";
  online: boolean;
  unread: number;
  profile: CustomerProfile;
  messages: Message[];
  mode: "bot" | "agent" | "paused" | "closed";
};
