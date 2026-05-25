"use client";

import { useEffect, useRef, useState } from "react";
import { OnlineAgent } from "@/lib/api";

function getWsBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return apiUrl.replace(/^http/, "ws");
}

/**
 * Subscribes to the global /ws/agents channel.
 * Keeps the list of online agents up-to-date in real-time.
 * Also calls onChatTransferred when a ticket is transferred to the current user.
 *
 * @param initialAgents - Snapshot dari GET /tickets/online-agents (fetch awal)
 * @param currentUserId - ID user yang sedang login (dikecualikan dari list)
 * @param onChatTransferred - Dipanggil saat ada ticket yang ditransfer ke user ini
 */
export function useAgentStatusWebSocket(
  initialAgents: OnlineAgent[],
  currentUserId?: number,
  onChatTransferred?: () => void
): OnlineAgent[] {
  const [agents, setAgents] = useState<OnlineAgent[]>(initialAgents);
  const onChatTransferredRef = useRef(onChatTransferred);

  // Sync callback ref agar selalu up-to-date tanpa restart WebSocket
  useEffect(() => {
    onChatTransferredRef.current = onChatTransferred;
  }, [onChatTransferred]);

  // Sync saat initial fetch selesai
  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  const wsRef = useRef<WebSocket | null>(null);
  const destroyedRef = useRef(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    destroyedRef.current = false;

    const connect = () => {
      if (destroyedRef.current) return;

      const ws = new WebSocket(`${getWsBase()}/ws/agents`);
      wsRef.current = ws;

      ws.onopen = () => {};

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "ticket_transferred") {
            // Jika ticket ini ditransfer ke user saat ini, reload daftar chat
            if (data.to_agent_id === currentUserId) {
              onChatTransferredRef.current?.();
            }
            return;
          }

          if (data.type === "ticket_claimed") {
            // Ticket diambil dari queue oleh agent lain — semua agent reload agar hilang dari list
            onChatTransferredRef.current?.();
            return;
          }

          if (data.type !== "agent_status") return;

          const { agent_id, name, display_name, status, is_available } = data as {
            type: string;
            agent_id: number;
            name: string;
            display_name: string;
            status: string;
            is_available: boolean;
          };

          // Jangan tampilkan diri sendiri
          if (agent_id === currentUserId) return;

          const isOnline = status === "online" && is_available;

          setAgents((prev) => {
            const exists = prev.some((a) => a.agent_id === agent_id);
            if (isOnline) {
              if (exists) {
                // Update data agent yang sudah ada
                return prev.map((a) =>
                  a.agent_id === agent_id
                    ? { ...a, status, is_available }
                    : a
                );
              }
              // Tambahkan agent yang baru online
              return [...prev, { agent_id, name, display_name, status, is_available }];
            } else {
              // Hapus agent yang offline/busy/unavailable
              return prev.filter((a) => a.agent_id !== agent_id);
            }
          });
        } catch {
          // abaikan event malformed
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyedRef.current) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      destroyedRef.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [currentUserId]);

  return agents;
}
