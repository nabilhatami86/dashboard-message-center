import { ArrowLeft, MessageSquare } from "lucide-react";
import ChatList from "@/components/chat/chat-list";
import ChatWindow from "@/components/chat/chat-window";
import CustomerDetail from "@/components/customer/customer-detail";
import type { Chat, ChatMode } from "@/app/types/types";

interface MediaPayload {
  media_url: string;
  media_type: string;
  media_filename: string;
}

interface CustomerChatsViewProps {
  chats: Chat[];
  activeChatId: number | null;
  activeChat: Chat | undefined;
  showCustomer: boolean;
  isSelectMode: boolean;
  selectedChats: Set<number>;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: number) => Promise<void>;
  onToggleSelectMode: () => void;
  onToggleChatSelection: (chatId: number) => void;
  onBulkDelete: () => Promise<void>;
  onSelectAll: () => void;
  onSendMessage: (text: string, media?: MediaPayload) => Promise<void>;
  onAssignAgent: () => Promise<void>;
  onPauseChat: (mode: ChatMode) => Promise<void>;
  onCustomerMessage: (text: string) => Promise<void>;
  onLoadChats: () => Promise<void>;
  onToggleCustomer: () => void;
  onCloseCustomer: () => void;
  onBack: () => void;
}

export function CustomerChatsView({
  chats,
  activeChatId,
  activeChat,
  showCustomer,
  isSelectMode,
  selectedChats,
  onSelectChat,
  onDeleteChat,
  onToggleSelectMode,
  onToggleChatSelection,
  onBulkDelete,
  onSelectAll,
  onSendMessage,
  onAssignAgent,
  onPauseChat,
  onCustomerMessage,
  onLoadChats,
  onToggleCustomer,
  onCloseCustomer,
  onBack,
}: CustomerChatsViewProps) {
  return (
    <div
      className="flex flex-col md:grid flex-1 min-w-0 h-full transition-all duration-300"
      style={{
        gridTemplateColumns: showCustomer
          ? "minmax(240px,280px) 1fr minmax(260px,300px)"
          : "minmax(240px,280px) 1fr",
      }}
    >
      {/* Chat List */}
      <div className={`${activeChat ? "hidden md:flex md:flex-col" : "flex flex-col"} border-r overflow-hidden`}>
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(chat) => onSelectChat(chat)}
          onDeleteChat={onDeleteChat}
          isSelectMode={isSelectMode}
          selectedChats={selectedChats}
          onToggleSelectMode={onToggleSelectMode}
          onToggleChatSelection={onToggleChatSelection}
          onBulkDelete={onBulkDelete}
          onSelectAll={onSelectAll}
        />
      </div>

      {activeChat ? (
        <>
          {/* Chat Window */}
          <div className="flex flex-col min-w-0 overflow-hidden">
            {/* Mobile back bar */}
            <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b bg-white flex-shrink-0">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali
              </button>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-600 font-medium truncate">{activeChat.name}</span>
            </div>
            <div className="flex-1 min-h-0">
              <ChatWindow
                chat={activeChat}
                onSendMessage={onSendMessage}
                onAssignAgent={onAssignAgent}
                onPauseChat={onPauseChat}
                onCustomerMessage={(text) => onCustomerMessage(text)}
                onOpenCustomer={onToggleCustomer}
                onNewMessage={onLoadChats}
              />
            </div>
          </div>

          {/* Customer Detail slide-in panel */}
          {showCustomer && (
            <div
              className="fixed inset-0 z-40 bg-black/40 md:static md:bg-transparent md:z-auto"
              onClick={(e) => { if (e.target === e.currentTarget) onCloseCustomer(); }}
            >
              <div className="absolute right-0 top-0 h-full w-[300px] sm:w-[320px] bg-white shadow-2xl md:static md:shadow-none md:w-auto overflow-y-auto">
                <CustomerDetail chat={activeChat} onClose={onCloseCustomer} />
              </div>
            </div>
          )}
        </>
      ) : (
        /* No chat selected placeholder */
        <div className="hidden md:flex items-center justify-center col-span-2 bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-center max-w-xs px-6">
            <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-neutral-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-800">Belum ada chat dipilih</p>
              <p className="text-sm text-neutral-400 mt-1">
                {chats.length === 0 ? "Belum ada chat masuk" : "Pilih chat dari daftar di kiri"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
