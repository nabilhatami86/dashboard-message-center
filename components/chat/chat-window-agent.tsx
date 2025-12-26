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
    <section className="flex h-full min-h-0 flex-col bg-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-neutral-200">
        <button
          onClick={onOpenCustomer}
          className="flex items-center gap-3 text-left hover:opacity-90"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-neutral-300 text-neutral-800 font-semibold">
              {chat.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-sm font-semibold text-neutral-900 leading-tight">
              {chat.name}
            </p>
            <Badge className="mt-0.5 bg-neutral-100 text-neutral-600 text-[11px]">
              {chat.channel}
            </Badge>
          </div>
        </button>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0 bg-neutral-50">
        <div className="px-6 py-6 space-y-5">
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
                  className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    fromAgent
                      ? "bg-neutral-900 text-white rounded-br-md"
                      : "bg-white text-neutral-900 border rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                      fromAgent ? "text-white/70" : "text-neutral-400"
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
          })}
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
            placeholder="Tulis pesan…"
            rows={1}
            className="
              flex-1 resize-none rounded-xl
              bg-neutral-100 px-4 py-3
              text-sm text-neutral-900
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-neutral-300
            "
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="
              rounded-xl bg-neutral-900 text-white
              hover:bg-neutral-800
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
