"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, ShieldCheck, Bot, UserCircle } from "lucide-react";
import { AdminChat } from "@/app/types/types";
import { AgentUser } from "@/lib/api";

interface Props {
  agent: AgentUser;
  adminChat: AdminChat;
  onSendMessage: (text: string) => void;
  onModeChange: (mode: "bot" | "manual") => void;
}

export default function AdminAgentChatWindow({
  agent,
  adminChat,
  onSendMessage,
  onModeChange,
}: Props) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminChat.messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-neutral-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {agent.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-bold text-neutral-900 flex items-center gap-2">
              {agent.name}
              {agent.online && (
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              )}
            </h2>
            <p className="text-xs text-neutral-500">{agent.email}</p>
          </div>
        </div>

        {/* Bot/Manual Mode Toggle */}
        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => onModeChange("bot")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              adminChat.mode === "bot"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Bot</span>
          </button>
          <button
            onClick={() => onModeChange("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              adminChat.mode === "manual"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            <UserCircle className="h-3.5 w-3.5" />
            <span>Manual</span>
          </button>
        </div>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {adminChat.messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-neutral-500 text-sm">
                No messages yet. Start a conversation with {agent.name}!
              </p>
            </div>
          ) : (
            adminChat.messages.map((msg) => {
              const isAdmin = msg.sender === "admin";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isAdmin ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isAdmin && (
                    <Avatar className="h-7 w-7 mt-1">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`group relative max-w-[70%] rounded-2xl px-4 py-2 ${
                      isAdmin
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-100 text-neutral-900"
                    }`}
                  >
                    {msg.sender_name && (
                      <p
                        className={`text-xs font-semibold mb-1 ${
                          isAdmin ? "text-blue-100" : "text-neutral-600"
                        }`}
                      >
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed break-words">
                      {msg.text}
                    </p>
                    <span
                      className={`mt-1 block text-xs ${
                        isAdmin ? "text-blue-100" : "text-neutral-500"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>

                  {isAdmin && (
                    <Avatar className="h-7 w-7 mt-1">
                      <AvatarFallback className="bg-indigo-600 text-white text-xs">
                        <ShieldCheck className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <footer className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 rounded-xl border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Send message to ${agent.name}...`}
              rows={2}
              className="w-full resize-none rounded-xl border-none bg-transparent px-4 py-3 text-sm outline-none"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 p-0 text-white hover:bg-blue-700 disabled:bg-neutral-300"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
