"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/app/types/types";
import { getAvailableTickets, claimTicketFromQueue } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";
import { useAuthStore } from "@/store/authStore";
import { Clock, User, AlertCircle, CheckCircle, Zap, RefreshCw, MessageSquare, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AgentSidebar from "@/components/ui/agent-sidebar";
import EmptyState from "@/components/ui/empty-state";

export default function AgentQueuePage() {
  const router = useRouter();
  const [availableTickets, setAvailableTickets] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!token || !user) {
      router.push("/login");
      return;
    }

    if (user.role !== "agent") {
      router.push("/dashboard-admin");
      return;
    }

    loadTickets();

    // Auto-refresh every 5 seconds for real-time queue
    const interval = setInterval(() => {
      loadTickets(false); // Don't show loading spinner on auto-refresh
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const loadTickets = async (showLoading = true) => {
    if (!token) return;

    const isFirstLoad = isFirstLoadRef.current;

    try {
      if (isFirstLoad && showLoading) {
        setLoading(true);
      }

      const ticketData = await getAvailableTickets(token);
      const transformedTickets = ticketData.map(transformChatResponse);

      setAvailableTickets(transformedTickets);
      setError(null);
    } catch (error) {
      console.error("Error loading tickets:", error);
      if (isFirstLoad) {
        setError("Failed to load tickets from queue");
      }
    } finally {
      if (isFirstLoad) {
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

      // Success! Show message and redirect to dashboard
      alert("✅ Ticket berhasil diambil!\n\nKamu sekarang bisa chat dengan customer. Redirecting...");

      // Redirect to dashboard agent with refresh parameter
      router.push("/dashboard-agent?refresh=true");
    } catch (error) {
      console.error("Error claiming ticket:", error);
      setError(error instanceof Error ? error.message : "Gagal mengambil ticket. Mungkin sudah diambil agent lain.");

      // Refresh tickets to get updated queue
      await loadTickets(false);
    } finally {
      setClaiming(null);
    }
  };

  const getWaitTime = (lastMessageAt: string) => {
    const created = new Date(lastMessageAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading ticket queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* SIDEBAR */}
      <AgentSidebar
        activeTab="customer"
        onTabChange={(tab) => {
          if (tab === "customer" || tab === "admin") {
            router.push("/dashboard-agent");
          }
        }}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex justify-between items-start sm:items-center gap-3">
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
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Pending di Queue</p>
                  <p className="text-xl sm:text-2xl font-bold">{availableTickets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Your Name</p>
                  <p className="text-base sm:text-lg font-semibold truncate">{user?.name || "Agent"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Status</p>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm sm:text-base font-bold text-green-600">ONLINE & READY</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Tickets Queue */}
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
                  {availableTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border-2 border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-blue-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Ticket Info */}
                        <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                              {ticket.name
                                ?.split(" ")
                                .map((w) => w[0])
                                .join("") || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                {ticket.name || "Unknown Customer"}
                              </h3>
                              {ticket.group_id ? (
                                <Badge className="bg-green-100 text-green-700 border-0 text-xs">Grup</Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Pribadi</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">{ticket.channel}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {ticket.mode?.toUpperCase() || "BOT"}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              {ticket.group_id && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Dari grup:</span>
                                  <span className="text-green-600 font-semibold truncate">
                                    {ticket.group_name || "Unknown Group"}
                                  </span>
                                </p>
                              )}
                              {!ticket.group_id && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Phone:</span>
                                  <span>{ticket.phone || "-"}</span>
                                </p>
                              )}
                              <p className="flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>Waiting: {ticket.lastMessageAt ? getWaitTime(ticket.lastMessageAt) : "Unknown"}</span>
                              </p>
                              {ticket.messages.length > 0 && (
                                <p className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                                  <span className="italic text-gray-500 line-clamp-2">
                                    &quot;{ticket.messages[ticket.messages.length - 1].text.substring(0, 80)}
                                    {ticket.messages[ticket.messages.length - 1].text.length > 80 ? "..." : ""}&quot;
                                  </span>
                                </p>
                              )}
                            </div>

                            <div className="mt-2 text-xs text-gray-400">
                              Last message: {ticket.lastMessageAt ? new Date(ticket.lastMessageAt).toLocaleString() : "Unknown"}
                            </div>
                          </div>
                        </div>

                        {/* Claim Button */}
                        <button
                          onClick={() => handleClaimTicket(ticket.id)}
                          disabled={claiming === ticket.id}
                          className={`w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                            claiming === ticket.id
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                          }`}
                        >
                          {claiming === ticket.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Claiming...
                            </span>
                          ) : (
                            "AMBIL SEKARANG!"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Cara Kerja Ticket Queue:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Chat masuk dari WhatsApp otomatis masuk ke queue</li>
                  <li>Ticket ditampilkan berdasarkan urutan waktu (FIFO - First In First Out)</li>
                  <li>Siapa cepat dia dapat! Klik &quot;AMBIL SEKARANG&quot; untuk claim ticket</li>
                  <li>Setelah diambil, chat akan muncul di dashboard agent kamu</li>
                  <li>Queue auto-refresh setiap 5 detik</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
