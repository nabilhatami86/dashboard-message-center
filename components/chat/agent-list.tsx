"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { AgentUser } from "@/lib/api";

interface Props {
  agents: AgentUser[];
  activeAgentId: number | null;
  onSelectAgent: (agent: AgentUser) => void;
}

export default function AgentList({
  agents,
  activeAgentId,
  onSelectAgent,
}: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-neutral-200 bg-white">
      {/* HEADER */}
      <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-neutral-900">Agents</h2>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {agents.length}
        </Badge>
      </header>

      {/* AGENT LIST */}
      <div className="flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-center text-sm text-neutral-500">
              No agents available
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {agents.map((agent) => {
              const isActive = activeAgentId === agent.id;

              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className={`w-full rounded-xl p-3 text-left transition-all ${
                    isActive
                      ? "bg-blue-100 shadow-md ring-2 ring-blue-500 ring-opacity-50"
                      : "bg-white hover:bg-neutral-50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {agent.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {agent.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`truncate font-semibold ${
                            isActive ? "text-blue-900" : "text-neutral-900"
                          }`}
                        >
                          {agent.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-neutral-500 truncate">
                          {agent.email}
                        </p>
                      </div>

                      {agent.phone && (
                        <p className="text-xs text-neutral-600 mt-0.5">
                          {agent.phone}
                        </p>
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
