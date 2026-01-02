"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, CheckCheck, Check, ShieldCheck, User, Users, UserCog } from "lucide-react";
import { AdminChat, Message } from "@/app/types/types";
import { useAuthStore } from "@/store/authStore";
import { getAdminList, AdminUser, getAgentList, AgentUser } from "@/lib/api";

interface Props {
  adminChat: AdminChat;
  onSendMessage: (text: string) => void;
}

export default function AdminChatWindow({
  adminChat,
  onSendMessage,
}: Props) {
  const [message, setMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminList, setShowAdminList] = useState(false);
  const [showAgentList, setShowAgentList] = useState(false);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [agentList, setAgentList] = useState<AgentUser[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminChat.messages.length]);

  // Load admin list
  useEffect(() => {
    async function loadAdminList() {
      if (!token) return;
      try {
        const admins = await getAdminList(token);
        setAdminList(admins);
      } catch (error) {
        console.error("Failed to load admin list:", error);
      }
    }
    loadAdminList();
  }, [token]);

  // Load agent list
  useEffect(() => {
    async function loadAgentList() {
      if (!token) return;
      try {
        const agents = await getAgentList(token);
        setAgentList(agents);
      } catch (error) {
        console.error("Failed to load agent list:", error);
      }
    }
    loadAgentList();
  }, [token]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              <ShieldCheck className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-semibold text-neutral-900 leading-tight">
              Admin Support
            </p>
            <Badge className="mt-0.5 bg-blue-100 text-blue-700 text-[11px] border-blue-200">
              Internal Chat
            </Badge>
          </div>
        </div>

        {/* Agent Profile & Admin List Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAgentList(!showAgentList)}
            className="hover:bg-green-50"
          >
            <UserCog className="h-4 w-4 mr-1" />
            List Agent
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdminList(!showAdminList)}
            className="hover:bg-blue-50"
          >
            <Users className="h-4 w-4 mr-1" />
            List Admin
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowProfile(!showProfile)}
            className="hover:bg-blue-50"
          >
            <User className="h-4 w-4 mr-1" />
            Profil Saya
          </Button>
        </div>
      </header>

      {/* AGENT LIST */}
      {showAgentList && (
        <div className="border-b border-neutral-200 bg-green-50 px-6 py-4 max-h-80 overflow-y-auto">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Daftar Agent</h3>
          <div className="space-y-2">
            {agentList.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-600 text-white font-semibold">
                      {agent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-900">{agent.name}</p>
                      {agent.online && (
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">@{agent.username}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-neutral-600 pl-13">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📧</span>
                    <span>{agent.email}</span>
                  </div>
                  {agent.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">📱</span>
                      <span>{agent.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN LIST */}
      {showAdminList && (
        <div className="border-b border-neutral-200 bg-blue-50 px-6 py-4 max-h-80 overflow-y-auto">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Daftar Admin</h3>
          <div className="space-y-2">
            {adminList.map((admin) => (
              <div key={admin.id} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {admin.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-900">{admin.name}</p>
                      {admin.online && (
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">@{admin.username}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-neutral-600 pl-13">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📧</span>
                    <span>{admin.email}</span>
                  </div>
                  {admin.phone && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">📱</span>
                      <span>{admin.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AGENT PROFILE CARD */}
      {showProfile && user && (
        <div className="border-b border-neutral-200 bg-blue-50 px-6 py-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-neutral-800 text-white font-semibold text-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-neutral-900">{user.name}</p>
                <Badge className="mt-1 bg-green-100 text-green-700 text-[10px]">
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="font-medium">Nomor:</span>
                <span>{user.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="font-medium">Username:</span>
                <span>@{user.username}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="font-medium">ID Agent:</span>
                <span>#{user.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0 bg-neutral-50">
        <div className="px-6 py-6 space-y-5">
          {adminChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShieldCheck className="h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">
                Belum ada pesan dengan admin
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Kirim pesan untuk memulai percakapan
              </p>
            </div>
          ) : (
            adminChat.messages.map((msg: Message) => {
              const fromAgent = msg.sender === "agent";
              const fromAdmin = msg.sender === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    fromAgent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      fromAgent
                        ? "bg-neutral-900 text-white rounded-br-md"
                        : fromAdmin
                        ? "bg-blue-600 text-white rounded-bl-md"
                        : "bg-white text-neutral-900 border rounded-bl-md"
                    }`}
                  >
                    {fromAdmin && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-90">
                        Admin
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                        fromAgent || fromAdmin
                          ? "text-white/70"
                          : "text-neutral-400"
                      }`}
                    >
                      <span>{msg.time}</span>
                      {fromAgent &&
                        (msg.status === "read" ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <footer className="border-t border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tulis pesan ke admin…"
            rows={1}
            className="
              flex-1 resize-none rounded-xl
              bg-neutral-100 px-4 py-3
              text-sm text-neutral-900
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-blue-300
            "
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="
              rounded-xl bg-blue-600 text-white
              hover:bg-blue-700
              disabled:opacity-40
            "
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
