import { Clock, User, CheckCircle, Zap, TrendingUp } from "lucide-react";
import type { AgentDailyStats } from "@/lib/api";

interface QueueStatCardsProps {
  ticketCount: number;
  userName: string;
  dailyStats: AgentDailyStats | null;
}

export function QueueStatCards({ ticketCount, userName, dailyStats }: QueueStatCardsProps) {
  const progress = dailyStats ? Math.min(100, Math.round((dailyStats.resolved_today / 20) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Pending di Queue</p>
            <p className="text-xl sm:text-2xl font-bold">{ticketCount}</p>
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
            <p className="text-base sm:text-lg font-semibold truncate">{userName}</p>
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

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600">Progress Hari Ini</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {dailyStats ? `${dailyStats.resolved_today}/20` : "—"}
            </p>
          </div>
        </div>
        {dailyStats && (
          <div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{progress}% dari target harian</p>
          </div>
        )}
      </div>
    </div>
  );
}
