import { Clock, MessageSquare, Loader2, Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Chat } from "@/app/types/types";

function getWaitTime(lastMessageAt: string): string {
  const diffMs   = new Date().getTime() - new Date(lastMessageAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

interface TicketCardProps {
  ticket: Chat;
  index: number;
  claiming: boolean;
  onClaim: (chatId: number) => void;
}

export function TicketCard({ ticket, index, claiming, onClaim }: TicketCardProps) {
  const isHigh = ticket.priority === "high";

  return (
    <div
      className={`relative border-2 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all ${
        isHigh ? "border-red-300 bg-red-50/40 hover:border-red-400" : "border-gray-200 hover:border-blue-300"
      }`}
    >
      {/* Priority badges */}
      {isHigh && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
          <Flame className="h-3 w-3" /> HIGH PRIORITY
        </div>
      )}
      {index === 0 && !isHigh && (
        <div className="absolute -top-3 left-4 bg-blue-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
          #1 ANTRIAN
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
            <AvatarFallback className={`font-semibold text-sm ${isHigh ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
              {ticket.name?.split(" ").map((w) => w[0]).join("") || "?"}
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
              <Badge variant="outline" className="text-xs">{ticket.mode?.toUpperCase() || "BOT"}</Badge>
              {ticket.priority === "high" ? (
                <Badge className="bg-red-500 text-white border-0 text-xs flex items-center gap-1">
                  <Flame className="h-3 w-3" /> High
                </Badge>
              ) : ticket.priority === "low" ? (
                <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Low</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Medium</Badge>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              {ticket.group_id ? (
                <p className="flex items-center gap-2">
                  <span className="font-medium">Dari grup:</span>
                  <span className="text-green-600 font-semibold truncate">{ticket.group_name || "Unknown Group"}</span>
                </p>
              ) : (
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

        <button
          onClick={() => onClaim(ticket.id)}
          disabled={claiming}
          className={`w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            claiming
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
          }`}
        >
          {claiming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Claiming...
            </span>
          ) : (
            "AMBIL SEKARANG!"
          )}
        </button>
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-3 sm:gap-4 flex-1">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
      </div>
    </div>
  );
}

export function QueueStatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}
