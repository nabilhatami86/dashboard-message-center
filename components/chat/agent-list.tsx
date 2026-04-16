"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { AgentUser } from "@/lib/api";

interface Props {
  agents: AgentUser[];
  activeAgentId: number | null;
  onSelectAgent: (agent: AgentUser) => void;
}

export default function AgentList({ agents, activeAgentId, onSelectAgent }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-neutral-100 bg-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-neutral-100 px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Agents</h2>
        </div>
        <span className="inline-flex items-center justify-center min-w-5.5 h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold tabular-nums">
          {agents.length}
        </span>
      </header>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-neutral-300" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Tidak ada agent tersedia</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {agents.map((agent) => {
              const isActive = activeAgentId === agent.id;
              const initials = agent.name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className={`w-full rounded-xl p-3 text-left transition-all duration-150 ${
                    isActive
                      ? "bg-blue-50 ring-1 ring-blue-200"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with online dot */}
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className={`text-sm font-semibold ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {agent.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-blue-900" : "text-neutral-900"}`}>
                          {agent.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 border-0 shrink-0 ${
                            agent.online
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {agent.online ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{agent.email}</p>
                      {agent.phone && (
                        <p className="text-xs text-neutral-500 mt-0.5">{agent.phone}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
