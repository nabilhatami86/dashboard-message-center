"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, CheckCheck, Check } from "lucide-react";
import { Chat, Message } from "@/app/types/types";

interface Props {
  chat: Chat;
  onSendMessage: (text: string) => void;
  onOpenCustomer?: () => void;
}

export default function ChatWindowAgent({
  chat,
  onSendMessage,
  onOpenCustomer,
}: Props) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#0F1320]">
      {/* HEADER */}
      <header className="flex items-center gap-3 border-b border-white/10 px-6 h-16">
        <button
          onClick={onOpenCustomer}
          className="flex items-center gap-3 text-left"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-white/10 text-white text-sm font-medium">
              {chat.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-medium text-white">{chat.name}</p>
            <Badge className="mt-0.5 bg-white/10 text-white text-[11px]">
              {chat.channel}
            </Badge>
          </div>
        </button>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 py-5 space-y-4">
          {chat.messages.map((msg: Message) => {
            const fromAgent = msg.sender === "agent";

            return (
              <div
                key={msg.id}
                className={`flex ${
                  fromAgent ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[65%] rounded-2xl px-4 py-2.5 ${
                    fromAgent
                      ? "bg-white/15 text-white"
                      : "bg-white/5 text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>

                  <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-white/50">
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
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <footer className="border-t border-white/10 px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-white/60 hover:text-white"
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
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            rows={1}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
