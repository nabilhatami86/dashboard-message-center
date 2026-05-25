"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/app/types/types";
import { getAvailableTickets, claimTicketFromQueue, getAgentDailyStats, AgentDailyStats } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";
import { useAuthStore } from "@/store/authStore";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TicketCard, TicketCardSkeleton, QueueStatCardSkeleton } from "@/components/agents/ticket-card";
import { QueueStatCards } from "@/components/agents/queue-stat-cards";
import { QueueInfoBox } from "@/components/agents/queue-info-box";
import AgentSidebar from "@/components/ui/agent-sidebar";
import EmptyState from "@/components/ui/empty-state";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function AgentQueuePage() {
  const router = useRouter();
  const [availableTickets, setAvailableTickets] = useState<Chat[]>([]);
  const [dailyStats, setDailyStats] = useState<AgentDailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!token || !user) { router.push("/login"); return; }
    if (user.role !== "agent") { router.push("/dashboard-admin"); return; }

    loadTickets();
    loadDailyStats();

    const interval = setInterval(() => {
      loadTickets(false);
      loadDailyStats();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const loadDailyStats = async () => {
    if (!token) return;
    try {
      setDailyStats(await getAgentDailyStats(token));
    } catch {
      // stats tidak kritis, abaikan error
    }
  };

  const loadTickets = async (showLoading = true) => {
    if (!token) return;
    const isFirst = isFirstLoadRef.current;
    try {
      if (isFirst && showLoading) setLoading(true);
      const tickets = (await getAvailableTickets(token))
        .map(transformChatResponse)
        .sort((a, b) => (PRIORITY_ORDER[a.priority ?? "medium"] ?? 1) - (PRIORITY_ORDER[b.priority ?? "medium"] ?? 1));
      setAvailableTickets(tickets);
      setError(null);
    } catch {
      if (isFirst) setError("Failed to load tickets from queue");
    } finally {
      if (isFirst) {
        setLoading(false);
        isFirstLoadRef.current = false;
      }
    }
  };

  const handleClaimTicket = async (chatId: number) => {
    if (!token) return;
    setClaiming(chatId);
    setError(null);
    try {
      await claimTicketFromQueue(chatId, token);
      alert("✅ Ticket berhasil diambil!\n\nKamu sekarang bisa chat dengan customer. Redirecting...");
      router.push("/dashboard-agent?refresh=true");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("sudah diambil") || msg.includes("409")
          ? "Ticket ini sudah diambil agent lain. Queue diperbarui."
          : "Gagal mengambil ticket. Silakan coba lagi."
      );
      await loadTickets(false);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        <AgentSidebar activeTab="customer" onTabChange={() => {}} />
        <div className="flex-1 overflow-auto">
          <div className="bg-white shadow sticky top-0 z-10 px-4 sm:px-6 py-4 sm:py-6">
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {Array.from({ length: 4 }).map((_, i) => <QueueStatCardSkeleton key={i} />)}
            </div>
            <div className="bg-white rounded-lg shadow">
              <div className="border-b px-4 sm:px-6 py-4">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-3 w-80 mt-2" />
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <TicketCardSkeleton key={i} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <AgentSidebar
        activeTab="customer"
        onTabChange={(tab) => {
          if (tab === "customer" || tab === "admin") router.push("/dashboard-agent");
        }}
      />

      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-start sm:items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">Ticket Queue</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
                Ambil ticket secepat mungkin! First In First Out (FIFO)
              </p>
            </div>
            <button
              onClick={() => loadTickets(true)}
              className="shrink-0 px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-8">
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-6" />}

          <QueueStatCards
            ticketCount={availableTickets.length}
            userName={user?.name || "Agent"}
            dailyStats={dailyStats}
          />

          <div className="bg-white rounded-lg shadow">
            <div className="border-b px-4 sm:px-6 py-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Available Tickets ({availableTickets.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Unassigned chats waiting for agents. Oldest first (FIFO).
              </p>
            </div>

            <div className="p-4 sm:p-6">
              {availableTickets.length === 0 ? (
                <EmptyState
                  icon="inbox"
                  title="Tidak ada ticket di queue"
                  description="Auto-refresh setiap 5 detik. Semua tickets sudah diambil atau belum ada customer yang chat. Tunggu customer baru!"
                />
              ) : (
                <div className="space-y-4">
                  {availableTickets.map((ticket, idx) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      index={idx}
                      claiming={claiming === ticket.id}
                      onClaim={handleClaimTicket}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <QueueInfoBox />
        </div>
      </div>
    </div>
  );
}
