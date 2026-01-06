"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/app/types/types";
import { getAvailableTickets, claimTicketFromQueue } from "@/lib/api";
import { transformChatResponse } from "@/lib/transform";
import { useAuthStore } from "@/store/authStore";
import { Clock, User, AlertCircle, CheckCircle, Zap, RefreshCw, ArrowLeft, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
    } catch (error: any) {
      console.error("Error claiming ticket:", error);
      setError(error.message || "Gagal mengambil ticket. Mungkin sudah diambil agent lain.");

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Queue</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ambil ticket secepat mungkin! First In First Out (FIFO) 🏃‍♂️
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => loadTickets(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push("/dashboard-agent")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending di Queue</p>
                <p className="text-2xl font-bold">{availableTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Name</p>
                <p className="text-lg font-semibold">{user?.name || "Agent"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-bold text-green-600">ONLINE & READY</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Tickets Queue */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Available Tickets ({availableTickets.length})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Unassigned chats waiting for agents. Oldest first (FIFO).
            </p>
          </div>

          <div className="p-6">
            {availableTickets.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada ticket di queue saat ini</p>
                <p className="text-sm text-gray-400 mt-2">
                  Auto-refresh setiap 5 detik. Tunggu customer baru chat!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Ticket Info */}
                      <div className="flex gap-4 flex-1">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {ticket.name
                              ?.split(" ")
                              .map((w) => w[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {ticket.name || "Unknown Customer"}
                            </h3>
                            <Badge variant="secondary">{ticket.channel}</Badge>
                            <Badge variant="outline">
                              {ticket.mode?.toUpperCase() || "BOT"}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Phone:</span>
                              <span>{ticket.phone || "-"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Waiting: {ticket.lastMessageAt ? getWaitTime(ticket.lastMessageAt) : "Unknown"}</span>
                            </p>
                            {ticket.messages.length > 0 && (
                              <p className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="italic text-gray-500">
                                  &quot;{ticket.messages[ticket.messages.length - 1].text.substring(0, 60)}
                                  {ticket.messages[ticket.messages.length - 1].text.length > 60 ? "..." : ""}&quot;
                                </span>
                              </p>
                            )}
                          </div>

                          <div className="mt-3 text-xs text-gray-400">
                            Last message: {ticket.lastMessageAt ? new Date(ticket.lastMessageAt).toLocaleString() : "Unknown"}
                          </div>
                        </div>
                      </div>

                      {/* Claim Button */}
                      <button
                        onClick={() => handleClaimTicket(ticket.id)}
                        disabled={claiming === ticket.id}
                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                          claiming === ticket.id
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:-translate-y-1"
                        }`}
                      >
                        {claiming === ticket.id ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Claiming...
                          </span>
                        ) : (
                          "🏃 AMBIL SEKARANG!"
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
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
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
  );
}
