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
} from "lucide-react";
import { Chat, Message, ChatMode } from "@/app/types/types";
import { uploadFile, UploadResponse } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

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
  const token = useAuthStore((s) => s.token);

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

  const systemInfoText = (() => {
    if (mode === "closed") {
      return "✅ Sesi chat sudah selesai. Chat baru dari customer akan ditangani bot terlebih dahulu.";
    }

    if (mode === "paused") {
      return "⏸️ Chat sedang dijeda sementara.";
    }

    if (mode === "agent") {
      return "💬 Bot dinonaktifkan. Semua pesan ditangani oleh Anda.";
    }

    if (mode === "bot") {
      return "🤖 Chat sedang ditangani oleh bot.";
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

        {/* End Chat Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleEndChat}
          disabled={isClosed || mode === "bot"}
          className={isClosed ? "opacity-50" : ""}
        >
          <X className="h-4 w-4 mr-1" />
          {isClosed ? "Selesai" : "End Chat"}
        </Button>
      </header>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0 bg-neutral-50">
        <div className="px-6 py-6 space-y-5">
          {/* SYSTEM INFO */}
          {systemInfoText && (
            <div className="flex justify-center">
              <div className="text-xs text-slate-600 bg-slate-100 border rounded-full px-4 py-1">
                {systemInfoText}
              </div>
            </div>
          )}

          {/* NOTIFIKASI SESI SELESAI (jika chat closed) */}
          {isClosed && (
            <div className="flex justify-center my-6">
              <div className="max-w-md text-center bg-green-50 border border-green-200 rounded-xl px-6 py-4">
                <div className="text-green-800 font-semibold mb-2">
                  ✅ Sesi Chat Berakhir
                </div>
                <p className="text-sm text-green-700">
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
            onChange={(e) => setMessage(e.target.value)}
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
