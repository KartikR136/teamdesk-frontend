"use client";

import { Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MeetingRsvpStatus } from "@/types";

const OPTIONS: { status: MeetingRsvpStatus; label: string; icon: React.ReactNode }[] = [
  { status: "ACCEPTED", label: "Accept", icon: <Check size={14} /> },
  { status: "TENTATIVE", label: "Maybe", icon: <HelpCircle size={14} /> },
  { status: "DECLINED", label: "Decline", icon: <X size={14} /> },
];

export function RsvpButtons({
  current,
  onChange,
  disabled,
}: {
  current?: MeetingRsvpStatus;
  onChange: (status: MeetingRsvpStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {OPTIONS.map((opt) => {
        const active = current === opt.status;
        return (
          <Button
            key={opt.status}
            size="sm"
            variant={active ? "primary" : "secondary"}
            disabled={disabled}
            onClick={() => onChange(opt.status)}
          >
            {opt.icon}
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
