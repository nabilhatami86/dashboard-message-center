"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Chat } from "@/app/types/types";

interface CustomerDetailProps {
  chat: Chat;
  onClose: () => void;
}

export default function CustomerDetail({ chat, onClose }: CustomerDetailProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const profile = chat.profile ?? {};

  return (
    <aside className="h-full w-80 flex flex-col border-l border-neutral-200 bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">
          Customer Detail
        </h3>

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
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* PROFILE CARD */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-5 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-white/10 text-lg font-semibold">
                {chat.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="font-semibold text-base leading-tight">
                {chat.name}
              </h2>

              <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    chat.online ? "bg-emerald-400" : "bg-neutral-400"
                  }`}
                />
                {chat.online ? "Online" : "Offline"}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-white/50 mt-1">
                <Clock className="h-3 w-3" />
                <span>{profile.lastActive ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>

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
