"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreference,
  type NotificationType,
} from "@/lib/notificationsApi";
import { NOTIFICATION_VISUALS } from "./notificationVisuals";
import { cn } from "@/lib/utils";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-fast",
        checked ? "bg-primary" : "bg-surface-hover border border-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-fast",
          checked ? "translate-x-[1.125rem]" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreference[] | null>(null);
  const [saving, setSaving] = useState<NotificationType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getNotificationPreferences()
      .then((res) => setPrefs(res.data))
      .catch(() =>
        toast({ title: "Couldn't load preferences", variant: "danger" }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (
    type: NotificationType,
    patch: Partial<Pick<NotificationPreference, "inApp" | "email">>,
  ) => {
    if (!prefs) return;
    const previous = prefs;
    const next = prefs.map((p) =>
      p.type === type ? { ...p, ...patch } : p,
    );
    setPrefs(next);
    setSaving(type);
    try {
      await setNotificationPreferences(next);
    } catch {
      setPrefs(previous);
      toast({ title: "Couldn't save preference", variant: "danger" });
    } finally {
      setSaving(null);
    }
  };

  if (!prefs) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={18} className="animate-spin text-text-subtle" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="grid grid-cols-[1fr_5rem_5rem] items-center px-4 py-2.5 border-b border-border bg-surface-hover/40">
        <span className="text-xs font-medium text-text-subtle uppercase tracking-wide">
          Event
        </span>
        <span className="text-xs font-medium text-text-subtle uppercase tracking-wide text-center">
          In-app
        </span>
        <span className="text-xs font-medium text-text-subtle uppercase tracking-wide text-center">
          Email
        </span>
      </div>

      <div className="divide-y divide-border">
        {prefs.map((p) => {
          const visual = NOTIFICATION_VISUALS[p.type];
          return (
            <div
              key={p.type}
              className="grid grid-cols-[1fr_5rem_5rem] items-center px-4 py-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                    visual.color,
                  )}
                >
                  {visual.icon}
                </span>
                <span className="text-sm text-text truncate">
                  {visual.label}
                </span>
                {saving === p.type && (
                  <Loader2
                    size={12}
                    className="animate-spin text-text-subtle shrink-0"
                  />
                )}
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={p.inApp}
                  onChange={(v) => update(p.type, { inApp: v })}
                  label={`Toggle in-app notifications for ${visual.label}`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={p.email}
                  onChange={(v) => update(p.type, { email: v })}
                  label={`Toggle email notifications for ${visual.label}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border bg-surface-hover/30">
        <p className="text-xs text-text-subtle leading-relaxed">
          Turning off &ldquo;In-app&rdquo; for an event stops it from being
          recorded in your notification inbox entirely. Email delivery is
          batched into a daily digest — a provider isn&apos;t configured
          yet, so email toggles are saved but won&apos;t send until one is
          wired up (see backend&apos;s{" "}
          <code className="px-1 py-0.5 rounded bg-surface-hover text-text-muted">
            EMAIL_PROVIDER_CONFIGURED
          </code>
          ).
        </p>
      </div>
    </div>
  );
}
