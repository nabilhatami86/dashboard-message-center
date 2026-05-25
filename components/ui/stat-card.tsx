import type { ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type StatColor = "blue" | "amber" | "purple" | "emerald" | "green" | "red" | "gray" | "yellow";

const colorMap: Record<StatColor, { bg: string; ring: string; shadow: string; text: string }> = {
  blue:    { bg: "from-blue-500 to-blue-600",    ring: "ring-blue-500/20",    shadow: "shadow-blue-500/25",    text: "text-blue-600" },
  amber:   { bg: "from-amber-500 to-amber-600",  ring: "ring-amber-500/20",   shadow: "shadow-amber-500/25",   text: "text-amber-600" },
  purple:  { bg: "from-purple-500 to-purple-600",ring: "ring-purple-500/20",  shadow: "shadow-purple-500/25",  text: "text-purple-600" },
  emerald: { bg: "from-emerald-500 to-emerald-600",ring:"ring-emerald-500/20",shadow: "shadow-emerald-500/25", text: "text-emerald-600" },
  green:   { bg: "from-green-500 to-green-600",  ring: "ring-green-500/20",   shadow: "shadow-green-500/25",   text: "text-green-600" },
  red:     { bg: "from-red-500 to-red-600",      ring: "ring-red-500/20",     shadow: "shadow-red-500/25",     text: "text-red-600" },
  gray:    { bg: "from-gray-400 to-gray-500",    ring: "ring-gray-500/20",    shadow: "shadow-gray-500/25",    text: "text-gray-600" },
  yellow:  { bg: "from-yellow-400 to-yellow-500",ring: "ring-yellow-500/20",  shadow: "shadow-yellow-500/25",  text: "text-yellow-600" },
};

interface StatCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value?: string | number;
  color: StatColor;
  delay?: number;
  isVisible?: boolean;
  children?: React.ReactNode;
}

export function StatCard({ icon: Icon, title, value, color, delay = 0, isVisible = true, children }: StatCardProps) {
  const theme = colorMap[color];
  return (
    <div
      className={`group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${theme.bg} ring-4 ${theme.ring} shadow-lg ${theme.shadow} mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      {children ?? <p className={`text-3xl font-bold ${theme.text} tracking-tight`}>{value}</p>}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
