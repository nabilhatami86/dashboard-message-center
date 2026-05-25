import { Users } from "lucide-react";
import AgentList from "@/components/chat/agent-list";
import AdminAgentChatWindow from "@/components/chat/admin-agent-chat-window";
import type { AdminChat } from "@/app/types/types";
import type { AgentUser } from "@/lib/api";

interface AgentChatsViewProps {
  agents: AgentUser[];
  activeAgentId: number | null;
  activeAgent: AgentUser | undefined;
  adminChat: AdminChat;
  onSelectAgent: (agent: AgentUser) => void;
  onSendMessage: (text: string) => Promise<void>;
  onModeChange: (mode: "bot" | "manual") => Promise<void>;
}

export function AgentChatsView({
  agents,
  activeAgentId,
  activeAgent,
  adminChat,
  onSelectAgent,
  onSendMessage,
  onModeChange,
}: AgentChatsViewProps) {
  return (
    <div className="grid flex-1 min-w-0 h-full grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr]">
      <AgentList
        agents={agents}
        activeAgentId={activeAgentId}
        onSelectAgent={onSelectAgent}
      />

      {activeAgent ? (
        <AdminAgentChatWindow
          agent={activeAgent}
          adminChat={adminChat}
          onSendMessage={onSendMessage}
          onModeChange={onModeChange}
        />
      ) : (
        <div className="hidden md:flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3 text-center max-w-xs px-6">
            <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <Users className="h-7 w-7 text-neutral-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-800">Belum ada agent dipilih</p>
              <p className="text-sm text-neutral-400 mt-1">
                {agents.length === 0 ? "Tidak ada agent tersedia" : "Pilih agent dari daftar di kiri"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
