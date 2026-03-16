"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  CheckCheck,
  Check,
  X,
  FileText,
  Download,
  Loader2,
  Bot,
  UserCog,
  PauseCircle,
  CheckCircle2,
  Pause,
  Play,
} from "lucide-react";
import { Chat, Message, ChatMode } from "@/app/types/types";
import { uploadFile, UploadResponse } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useTypingWebSocket } from "@/hooks/useTypingWebSocket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  chat: Chat;
  onSendMessage: (text: string, media?: { media_url: string; media_type: string; media_filename: string }) => void;
  onEndChat?: (mode: ChatMode) => void;
  onOpenCustomer?: () => void;
}

export default function ChatWindowAgent({
  chat,
  onSendMessage,
  onEndChat,
  onOpenCustomer,
}: Props) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const agentTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useAuthStore((s) => s.token);

  const { customerTyping, sendAgentTyping, wsConnected } = useTypingWebSocket(chat.id);

  const handleAgentTyping = (value: string) => {
    if (value.length > 0) {
      sendAgentTyping(true);
      if (agentTypingTimerRef.current) clearTimeout(agentTypingTimerRef.current);
      agentTypingTimerRef.current = setTimeout(() => sendAgentTyping(false), 2000);
    } else {
      sendAgentTyping(false);
    }
  };

  // Media attachment state
  const [pendingMedia, setPendingMedia] = useState<UploadResponse | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mode: ChatMode = chat.mode ?? "bot";
  const isClosed = mode === "closed";
  const isPaused = mode === "paused";
  const disabled = isClosed || isPaused;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  const handleSend = () => {
    if ((!message.trim() && !pendingMedia) || disabled) return;

    const mediaPayload = pendingMedia
      ? { media_url: pendingMedia.media_url, media_type: pendingMedia.media_type, media_filename: pendingMedia.media_filename }
      : undefined;

    onSendMessage(
      message.trim() || (pendingMedia ? `[${pendingMedia.media_type === "image" ? "Image" : "File"}]` : ""),
      mediaPayload
    );
    setMessage("");
    clearPendingMedia();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(file, token);
      setPendingMedia(result);
      if (result.media_type === "image") {
        setMediaPreviewUrl(URL.createObjectURL(file));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearPendingMedia = () => {
    setPendingMedia(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
      setMediaPreviewUrl(null);
    }
  };

  const handleEndChat = () => {
    if (window.confirm("Akhiri sesi chat ini? Customer akan kembali ke bot jika chat lagi.")) {
      onEndChat?.("closed");
    }
  };

  const systemInfoBanner = (() => {
    if (mode === "closed") {
      return { icon: CheckCircle2, text: "Sesi chat sudah selesai. Chat baru dari customer akan ditangani bot.", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (mode === "paused") {
      return { icon: PauseCircle, text: "Chat sedang dijeda sementara.", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (mode === "agent") {
      return { icon: UserCog, text: "Bot dinonaktifkan. Semua pesan ditangani oleh Anda.", color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (mode === "bot") {
      return { icon: Bot, text: "Chat sedang ditangani oleh bot.", color: "bg-slate-50 text-slate-600 border-slate-200" };
    }
    return null;
  })();

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
            <div className="flex gap-2 mt-0.5">
              <Badge className="bg-neutral-100 text-neutral-600 text-[11px]">
                {chat.channel}
              </Badge>
              <Badge
                variant={
                  mode === "bot"
                    ? "default"
                    : mode === "agent"
                    ? "outline"
                    : "destructive"
                }
                className="text-[11px]"
              >
                {mode.toUpperCase()}
              </Badge>
            </div>
          </div>
        </button>

        <div className="flex gap-1 shrink-0">
          {/* Pause / Resume — hanya saat mode agent atau paused */}
          {(mode === "agent" || mode === "paused") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEndChat?.(isPaused ? "agent" : "paused")}
              disabled={isClosed}
              className={`text-xs h-7 px-2 ${
                isPaused
                  ? "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  : "text-amber-600 border-amber-300 hover:bg-amber-50"
              }`}
              title={isPaused ? "Resume chat" : "Jeda chat sementara"}
            >
              {isPaused ? (
                <><Play className="h-3.5 w-3.5 mr-1" />Resume</>
              ) : (
                <><Pause className="h-3.5 w-3.5 mr-1" />Jeda</>
              )}
            </Button>
          )}

          {/* End Chat Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleEndChat}
            disabled={isClosed || mode === "bot"}
            className={`text-xs h-7 px-2 ${isClosed ? "opacity-50" : ""}`}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {isClosed ? "Selesai" : "End Chat"}
          </Button>

          {/* WS status dot */}
          <span
            title={wsConnected ? "Real-time terhubung" : "Menghubungkan..."}
            className={`h-2 w-2 rounded-full shrink-0 ${wsConnected ? "bg-emerald-400" : "bg-slate-300 animate-pulse"}`}
          />
        </div>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0 bg-neutral-50">
        <div className="px-4 sm:px-6 py-5 space-y-5">
          {/* SYSTEM INFO BANNER */}
          {systemInfoBanner && (
            <div className="flex justify-center">
              <div className={`flex items-center gap-2 text-xs border rounded-full px-3 py-1.5 ${systemInfoBanner.color}`}>
                <systemInfoBanner.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{systemInfoBanner.text}</span>
              </div>
            </div>
          )}

          {/* NOTIFIKASI SESI SELESAI (jika chat closed) */}
          {isClosed && (
            <div className="flex justify-center my-6">
              <div className="max-w-md w-full text-center bg-emerald-50 border border-emerald-200 rounded-xl px-4 sm:px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-semibold mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Sesi Chat Berakhir
                </div>
                <p className="text-sm text-emerald-700">
                  Terima kasih atas waktunya. Sesi chat telah selesai. Jika customer chat lagi, percakapan akan dimulai dari bot.
                </p>
              </div>
            </div>
          )}

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
                  {/* Show participant name for group chats (customer messages only) */}
                  {!fromAgent && chat.group_id && (msg.participant_name || msg.participant_phone) && (
                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {msg.participant_name || msg.participant_phone}
                    </p>
                  )}

                  {/* Media attachment rendering */}
                  {msg.media_url && msg.media_type === "image" && (
                    <a
                      href={`${API_BASE_URL}${msg.media_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-2"
                    >
                      <img
                        src={`${API_BASE_URL}${msg.media_url}`}
                        alt={msg.media_filename || "Image"}
                        className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                    </a>
                  )}
                  {msg.media_url && msg.media_type === "document" && (
                    <a
                      href={`${API_BASE_URL}${msg.media_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${
                        fromAgent ? "bg-white/10 hover:bg-white/20" : "bg-neutral-100 hover:bg-neutral-200"
                      } transition-colors`}
                    >
                      <FileText className="h-5 w-5 shrink-0" />
                      <span className="text-sm truncate flex-1">
                        {msg.media_filename || "File"}
                      </span>
                      <Download className="h-4 w-4 shrink-0" />
                    </a>
                  )}
                  {msg.media_url && msg.media_type === "video" && (
                    <video
                      src={`${API_BASE_URL}${msg.media_url}`}
                      controls
                      className="rounded-lg max-w-full max-h-64 mb-2"
                    />
                  )}
                  {msg.media_url && msg.media_type === "audio" && (
                    <audio
                      src={`${API_BASE_URL}${msg.media_url}`}
                      controls
                      className="mb-2 max-w-full"
                    />
                  )}

                  {/* Text content */}
                  {msg.text && !(msg.media_url && /^\[(Image|Video|Audio|Document|Sticker)\]$/.test(msg.text.trim())) && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

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
          {/* Typing indicator — customer sedang mengetik */}
          {customerTyping && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                <span className="text-xs text-neutral-500">{chat.name} sedang mengetik</span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <footer className="border-t border-neutral-200 bg-white">
        {/* Media preview */}
        {pendingMedia && (
          <div className="px-4 pt-3 pb-2 bg-blue-50 border-b flex items-center gap-3">
            {pendingMedia.media_type === "image" && mediaPreviewUrl ? (
              <img
                src={mediaPreviewUrl}
                alt="Preview"
                className="h-16 w-16 object-cover rounded-lg border"
              />
            ) : (
              <div className="h-16 w-16 bg-slate-200 rounded-lg flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {pendingMedia.media_filename}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {pendingMedia.media_type}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={clearPendingMedia}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="px-4 py-3 flex items-end gap-2">
          {/* File Input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            size="icon"
            variant="ghost"
            className="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </Button>

          <textarea
            value={message}
            disabled={disabled}
            onChange={(e) => {
              setMessage(e.target.value);
              handleAgentTyping(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isClosed
                ? "Sesi chat sudah selesai. Chat baru dari customer akan mulai dari bot."
                : isPaused
                ? "Chat sedang dijeda sementara."
                : "Tulis pesan…"
            }
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
            disabled={(!message.trim() && !pendingMedia) || disabled}
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
