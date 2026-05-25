"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MapPin,
  MessageCircle,
  Mail,
  Clock,
  Star,
  X,
  Flag,
  ChevronDown,
  Check,
} from "lucide-react";
import { Chat } from "@/app/types/types";

type Priority = "low" | "medium" | "high";

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; textColor: string; dotColor: string; bgColor: string }
> = {
  low:    { label: "Low",    textColor: "text-slate-500",  dotColor: "bg-slate-400",  bgColor: "bg-slate-50"  },
  medium: { label: "Medium", textColor: "text-amber-600",  dotColor: "bg-amber-400",  bgColor: "bg-amber-50"  },
  high:   { label: "High",   textColor: "text-red-600",    dotColor: "bg-red-500",    bgColor: "bg-red-50"    },
};

interface CustomerDetailProps {
  chat: Chat;
  onClose: () => void;
  onUpdatePriority?: (priority: Priority) => void;
}

function CustomerDetail({ chat, onClose, onUpdatePriority }: CustomerDetailProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const profile = chat.profile ?? {};

  return (
    <aside className="h-full w-full flex flex-col border-l border-neutral-200 bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 sm:px-5 h-14 border-b border-neutral-200 flex-shrink-0">
        <h3 className="text-sm font-semibold text-neutral-900">Customer Detail</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFavorite((v) => !v)}
            className={isFavorite ? "text-amber-500" : "text-neutral-400"}
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 sm:py-6 space-y-6 sm:space-y-8">
        {/* PROFILE CARD */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-5 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-white/10 text-lg font-semibold">
                {chat.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-base leading-tight">{chat.name ?? "Unknown"}</h2>
              <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                <span className={`h-2 w-2 rounded-full ${chat.online ? "bg-emerald-400" : "bg-neutral-400"}`} />
                {chat.online ? "Online" : "Offline"}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-white/50 mt-1">
                <Clock className="h-3 w-3" />
                <span>{profile.lastActive ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRIORITY SELECTOR */}
        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Priority
          </h4>
          <PrioritySelector
            currentPriority={(chat.priority as Priority) ?? "medium"}
            onSelect={(p) => onUpdatePriority?.(p)}
          />
        </section>

        {/* CONTACT */}
        <section className="space-y-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Contact Info
          </h4>
          <InfoItem
            icon={<MessageCircle className="h-4 w-4 text-emerald-600" />}
            title="Channel"
            content={<Badge variant="secondary">{chat.channel}</Badge>}
          />
          <InfoItem
            icon={<Phone className="h-4 w-4 text-sky-600" />}
            title="Phone"
            content={profile.phone ?? "-"}
          />
          <InfoItem
            icon={<Mail className="h-4 w-4 text-indigo-600" />}
            title="Email"
            content={profile.email ?? "-"}
          />
          <InfoItem
            icon={<MapPin className="h-4 w-4 text-rose-600" />}
            title="Address"
            content={profile.address ?? "-"}
          />
        </section>

        {/* NOTES */}
        {profile.notes && (
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Notes
            </h4>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 leading-relaxed">
              {profile.notes}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

export default memo(CustomerDetail, (prevProps, nextProps) => {
  return (
    prevProps.chat === nextProps.chat &&
    prevProps.onUpdatePriority === nextProps.onUpdatePriority
  );
});

function PrioritySelector({
  currentPriority,
  onSelect,
}: {
  currentPriority: Priority;
  onSelect: (p: Priority) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = PRIORITY_CONFIG[currentPriority];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 shrink-0">
          <Flag className={`h-4 w-4 ${current.textColor}`} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[11px] text-neutral-500">Customer Priority</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-2 w-2 rounded-full ${current.dotColor}`} />
            <span className={`text-sm font-semibold ${current.textColor}`}>{current.label}</span>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
          {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(
            ([key, cfg]) => {
              const isActive = currentPriority === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSelect(key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isActive ? cfg.bgColor : "hover:bg-neutral-50"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dotColor}`} />
                  <span className={`text-sm font-medium flex-1 text-left ${isActive ? cfg.textColor : "text-neutral-700"}`}>
                    {cfg.label}
                  </span>
                  {isActive && <Check className={`h-3.5 w-3.5 ${cfg.textColor}`} />}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-neutral-500">{title}</p>
        <div className="text-sm font-medium text-neutral-900">{content}</div>
      </div>
    </div>
  );
}
