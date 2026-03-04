"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  MoreVertical,
  UserPlus,
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  X,
  Zap,
  FileText,
  Download,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { Chat, Message, ChatMode, ShortcutMessage } from "@/app/types/types";
import { getShortcuts, uploadFile, UploadResponse, AgentUser } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ChatWindowProps {
  chat: Chat;
  onSendMessage: (text: string, media?: { media_url: string; media_type: string; media_filename: string }) => void;
  onAssignAgent: () => void;
  onPauseChat: (nextMode: ChatMode) => void;
  onCustomerMessage: (text: string) => void;
  onOpenCustomer?: () => void;
  onTransferTicket?: (toAgentId: number, reason: string) => Promise<void>;
  availableAgents?: AgentUser[];
}

function ChatWindow({
  chat,
  onSendMessage,
  onAssignAgent,
  onPauseChat,
  onOpenCustomer,
  onTransferTicket,
  availableAgents = [],
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Media attachment state
  const [pendingMedia, setPendingMedia] = useState<UploadResponse | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferAgentId, setSelectedTransferAgentId] = useState<number | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const currentUser = useAuthStore((s) => s.user);

  // Shortcut inline dropdown state
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [allShortcuts, setAllShortcuts] = useState<ShortcutMessage[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [shortcutsLoaded, setShortcutsLoaded] = useState(false);
  const token = useAuthStore((s) => s.token);

  /** mode aman (fallback) */
  const mode: ChatMode = chat.mode ?? "bot";

  const isPaused = mode === "paused";
  const isClosed = mode === "closed";
  const isAgent = mode === "agent";
  const disabled = isPaused || isClosed;

  const handleSend = () => {
    // Allow send if there's text OR media
    if ((!message.trim() && !pendingMedia) || !isAgent) return;

    const mediaPayload = pendingMedia
      ? { media_url: pendingMedia.media_url, media_type: pendingMedia.media_type, media_filename: pendingMedia.media_filename }
      : undefined;

    if (editingMessage) {
      // TODO: Implement edit message API
      setEditingMessage(null);
    } else if (replyTo) {
      const replyMessage = `[Reply to: ${replyTo.text}]\n${message}`;
      onSendMessage(replyMessage, mediaPayload);
      setReplyTo(null);
    } else {
      onSendMessage(message.trim() || (pendingMedia ? `[${pendingMedia.media_type === "image" ? "Image" : "File"}]` : ""), mediaPayload);
    }

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

      // Create preview URL for images
      if (result.media_type === "image") {
        setMediaPreviewUrl(URL.createObjectURL(file));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
      // Reset file input
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

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setEditingMessage(null);
  };

  const handleEdit = (msg: Message) => {
    setMessage(msg.text);
    setEditingMessage(msg);
    setReplyTo(null);
  };

  const handleDelete = (msg: Message) => {
    if (window.confirm("Hapus pesan ini?")) {
      // TODO: Implement delete message API for msg.id
      void msg; // Suppress unused variable warning
    }
  };

  const cancelReplyOrEdit = () => {
    setReplyTo(null);
    setEditingMessage(null);
    setMessage("");
  };

  // Load shortcuts from API (once)
  const loadShortcuts = useCallback(async () => {
    if (!token || shortcutsLoaded) return;
    try {
      const data = await getShortcuts(token);
      setAllShortcuts(data);
      setShortcutsLoaded(true);
    } catch {
      // silently fail
    }
  }, [token, shortcutsLoaded]);

  // Filter shortcuts based on what user typed after "/"
  const filteredShortcuts = allShortcuts.filter((sc) => {
    if (!message.startsWith("/")) return true; // show all when opened via button
    const typed = message.toLowerCase();
    return (
      sc.key.toLowerCase().includes(typed) ||
      sc.values.toLowerCase().includes(typed)
    );
  });

  // Open inline dropdown
  const openShortcutList = useCallback(() => {
    loadShortcuts();
    setSelectedIdx(0);
    setShowShortcuts(true);
  }, [loadShortcuts]);

  // Handle textarea change — show list when "/" is typed
  const handleMessageChange = useCallback(
    (value: string) => {
      setMessage(value);
      if (value.startsWith("/")) {
        openShortcutList();
      } else {
        setShowShortcuts(false);
      }
    },
    [openShortcutList]
  );

  // Pick a shortcut
  const selectShortcut = useCallback(
    (shortcut: ShortcutMessage) => {
      setMessage(shortcut.values);
      setShowShortcuts(false);
      textareaRef.current?.focus();
    },
    []
  );

  const handleEndChat = () => {
    if (
      window.confirm(
        "Akhiri sesi chat ini? Customer akan kembali ke bot jika chat lagi."
      )
    ) {
      // Set ke closed untuk mengakhiri chat
      onPauseChat("closed");
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTransferAgentId || !onTransferTicket) return;
    setIsTransferring(true);
    try {
      await onTransferTicket(selectedTransferAgentId, transferReason);
      setShowTransferModal(false);
      setSelectedTransferAgentId(null);
      setTransferReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal transfer ticket");
    } finally {
      setIsTransferring(false);
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
      return "💬 Bot dinonaktifkan. Semua pesan ditangani oleh agent.";
    }

    if (mode === "bot") {
      return "🤖 Chat sedang ditangani oleh bot. Klik Assign untuk mengambil alih percakapan.";
    }

    return null;
  })();

  /** auto scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* HEADER */}
      <div className="border-b p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenCustomer}
          className="flex items-center gap-3"
        >
          <Avatar>
            <AvatarFallback>
              {chat.name
                ?.split(" ")
                .map((w) => w[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold">
              {/* Nama participant (untuk grup) atau customer (untuk pribadi) */}
              {chat.name || "Unknown"}
            </p>
            {/* Untuk grup: tampilkan nama grup di bawah */}
            {chat.group_id && chat.group_name && (
              <p className="text-xs text-green-600">Dari: {chat.group_name}</p>
            )}
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">{chat.channel}</Badge>
              {chat.group_id ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                  Grup
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                  Pribadi
                </Badge>
              )}
              <Badge
                variant={
                  mode === "bot"
                    ? "default"
                    : mode === "agent"
                    ? "outline"
                    : "destructive"
                }
              >
                {mode.toUpperCase()}
              </Badge>
            </div>
          </div>
        </button>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onAssignAgent}
            disabled={mode !== "bot"}
            className="h-7 px-2 text-xs"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Assign
          </Button>

          {/* Transfer button — hanya muncul jika mode agent & ada handler */}
          {onTransferTicket && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTransferModal(true)}
              disabled={mode !== "agent" || isClosed}
              className="h-7 px-2 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Transfer
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleEndChat}
            disabled={isClosed || mode === "bot"}
            className={`h-7 px-2 text-xs ${isClosed ? "opacity-50" : ""}`}
          >
            <X className="h-3 w-3 mr-1" />
            {isClosed ? "Selesai" : "End"}
          </Button>

          <Button size="icon" variant="ghost" className="h-7 w-7">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* MESSAGES */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-4">
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
                  Terima kasih atas waktunya. Sesi chat telah selesai. Jika
                  customer chat lagi, percakapan akan dimulai dari bot.
                </p>
              </div>
            </div>
          )}

          {chat.messages.map((msg: Message) => {
            const fromAgent = msg.sender === "agent";

            return (
              <div
                key={msg.id}
                className={`group flex ${
                  fromAgent ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-end gap-2 max-w-[70%]">
                  {/* Message actions - show on hover (left side for agent, right side for customer) */}
                  {fromAgent && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-slate-200"
                        onClick={() => handleReply(msg)}
                        title="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-slate-200"
                        onClick={() => handleEdit(msg)}
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                        onClick={() => handleDelete(msg)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-xl px-4 py-2 ${
                      fromAgent ? "bg-blue-500 text-white" : "bg-slate-100"
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
                          fromAgent ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 hover:bg-slate-300"
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

                    {/* Text content (skip if text is just a media placeholder) */}
                    {msg.text && !(msg.media_url && /^\[(Image|Video|Audio|Document|Sticker)\]$/.test(msg.text.trim())) && (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    )}
                    <div className="flex items-center justify-end gap-1 text-xs mt-1 opacity-70">
                      <span>{msg.time}</span>
                      {fromAgent &&
                        (msg.status === "read" ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        ))}
                    </div>
                  </div>

                  {/* Message actions for customer messages */}
                  {!fromAgent && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-slate-200"
                        onClick={() => handleReply(msg)}
                        title="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* INPUT */}
      <div className="border-t">
        {/* Reply/Edit indicator */}
        {(replyTo || editingMessage) && (
          <div className="px-4 pt-3 pb-2 bg-slate-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {editingMessage ? (
                <>
                  <Edit2 className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700">
                    Editing message:{" "}
                    <span className="font-medium">
                      {editingMessage.text.substring(0, 30)}...
                    </span>
                  </span>
                </>
              ) : replyTo ? (
                <>
                  <Reply className="h-4 w-4 text-blue-600" />
                  <span className="text-slate-700">
                    Replying to:{" "}
                    <span className="font-medium">
                      {replyTo.text.substring(0, 30)}...
                    </span>
                  </span>
                </>
              ) : null}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={cancelReplyOrEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Inline shortcut list — muncul di atas textarea */}
        {showShortcuts && filteredShortcuts.length > 0 && (
          <div className="mx-4 mt-2 border rounded-lg shadow-lg bg-white max-h-52 overflow-y-auto">
            <div className="px-3 py-1.5 text-xs text-slate-400 border-b flex items-center gap-1 sticky top-0 bg-white">
              <Zap className="h-3 w-3" />
              Pilih Shortcut
            </div>
            {filteredShortcuts.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                className={`w-full text-left px-3 py-2 border-b last:border-b-0 transition-colors ${
                  idx === selectedIdx
                    ? "bg-blue-50"
                    : "hover:bg-slate-50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectShortcut(sc);
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-blue-600 text-sm">
                    {sc.key}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {sc.creator_name || `User #${sc.created_by}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {sc.values}
                </p>
              </button>
            ))}
          </div>
        )}

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

        <div className="p-4 flex gap-2 items-end">
          {/* Shortcut Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              if (showShortcuts) {
                setShowShortcuts(false);
              } else {
                setMessage("/");
                openShortcutList();
              }
            }}
            disabled={disabled || !isAgent}
            title="Shortcut Messages"
            className="shrink-0"
          >
            <Zap className="h-5 w-5" />
          </Button>

          {/* Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !isAgent || isUploading}
            title="Kirim File / Image"
            className="shrink-0"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </Button>

          <textarea
            ref={textareaRef}
            value={message}
            disabled={disabled || !isAgent}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={(e) => {
              // Keyboard navigation for shortcut list
              if (showShortcuts && filteredShortcuts.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIdx((prev) =>
                    prev < filteredShortcuts.length - 1 ? prev + 1 : 0
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIdx((prev) =>
                    prev > 0 ? prev - 1 : filteredShortcuts.length - 1
                  );
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  selectShortcut(filteredShortcuts[selectedIdx]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowShortcuts(false);
                  setMessage("");
                  return;
                }
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              if (e.key === "Escape") {
                cancelReplyOrEdit();
              }
            }}
            placeholder={
              isClosed
                ? "Sesi chat sudah selesai."
                : isPaused
                ? "Chat sedang dijeda sementara."
                : !isAgent
                ? "Assign ke agent untuk membalas"
                : editingMessage
                ? "Edit your message..."
                : replyTo
                ? "Type your reply..."
                : 'Tulis pesan... (ketik "/" untuk shortcut)'
            }
            className="flex-1 resize-none rounded-lg border px-3 py-2"
            rows={3}
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!message.trim() && !pendingMedia) || !isAgent || disabled}
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-orange-500" />
                Transfer ke Agent Lain
              </h2>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedTransferAgentId(null);
                  setTransferReason("");
                }}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-500 mb-4">
              Transfer chat <span className="font-medium text-neutral-800">{chat.name}</span> ke agent lain yang lebih sesuai.
            </p>

            {/* Daftar Agent */}
            <div className="mb-4">
              <label className="text-xs font-medium text-neutral-600 mb-2 block">
                Pilih Agent Tujuan
              </label>
              {availableAgents.filter((a) => a.id !== currentUser?.id).length === 0 ? (
                <p className="text-sm text-neutral-400 py-3 text-center border rounded-lg">
                  Tidak ada agent lain yang tersedia
                </p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {availableAgents
                    .filter((a) => a.id !== currentUser?.id)
                    .map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedTransferAgentId(agent.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                          selectedTransferAgentId === agent.id
                            ? "bg-orange-50 border-l-2 border-orange-500"
                            : "hover:bg-neutral-50"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0">
                          {agent.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{agent.name}</p>
                          <p className="text-xs text-neutral-400">{agent.email}</p>
                        </div>
                        {selectedTransferAgentId === agent.id && (
                          <Check className="h-4 w-4 text-orange-500 ml-auto" />
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Alasan (opsional) */}
            <div className="mb-5">
              <label className="text-xs font-medium text-neutral-600 mb-2 block">
                Alasan Transfer <span className="text-neutral-400">(opsional)</span>
              </label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Contoh: Customer butuh bantuan teknis billing, saya tidak menguasai bidang ini"
                rows={3}
                className="w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedTransferAgentId(null);
                  setTransferReason("");
                }}
                className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-neutral-50"
                disabled={isTransferring}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={!selectedTransferAgentId || isTransferring}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTransferring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4" />
                )}
                {isTransferring ? "Mentransfer..." : "Transfer Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memo untuk mencegah re-render jika chat tidak berubah
export default memo(ChatWindow, (prevProps, nextProps) => {
  return prevProps.chat === nextProps.chat;
});
