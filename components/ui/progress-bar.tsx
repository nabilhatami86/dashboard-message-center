import type { ReactNode } from "react";

type ProgressColor = "amber" | "blue" | "orange" | "emerald" | "gray" | "purple";

const progressColorMap: Record<ProgressColor, { bar: string; bg: string }> = {
  amber:   { bar: "bg-amber-500",   bg: "bg-amber-100" },
  blue:    { bar: "bg-blue-500",    bg: "bg-blue-100" },
  orange:  { bar: "bg-orange-500",  bg: "bg-orange-100" },
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-100" },
  gray:    { bar: "bg-gray-400",    bg: "bg-gray-100" },
  purple:  { bar: "bg-purple-500",  bg: "bg-purple-100" },
};

export function ProgressBar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: number;
  percent: number;
  color: ProgressColor;
}) {
  const theme = progressColorMap[color];
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-600 font-semibold">
          {value} <span className="text-slate-400 font-normal">({Math.round(percent)}%)</span>
        </span>
      </div>
      <div className={`w-full ${theme.bg} rounded-full h-2.5 overflow-hidden`}>
        <div
          className={`${theme.bar} h-2.5 rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function MetricCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "emerald";
}) {
  const textColor = color === "blue" ? "text-blue-600" : "text-emerald-600";
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className={textColor}>{icon}</div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className={`text-4xl font-bold ${textColor} mb-2 tracking-tight`}>{value}</div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "slate" | "blue" | "emerald" | "amber";
}) {
  const textColors = {
    slate:   "text-slate-700",
    blue:    "text-blue-600",
    emerald: "text-emerald-600",
    amber:   "text-amber-600",
  };
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${textColors[color]} tracking-tight`}>{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}
