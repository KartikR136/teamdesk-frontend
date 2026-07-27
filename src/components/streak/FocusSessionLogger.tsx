"use client";

import { useState } from "react";
import { Clock, Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useNotify } from "@/lib/notifications";
import { apiFetch, ApiError } from "@/lib/api";

// Deliberately manual, not auto-estimated — see FocusSession model comment
// in schema.prisma. Honest self-reporting beats a fabricated number
// derived from activity timestamps.
export function FocusSessionLogger({ onLogged }: { onLogged: (minutes: number) => void }) {
  const notify = useNotify();
  const [minutes, setMinutes] = useState("60");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLog() {
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins < 1) {
      notify.error("Enter a valid number of minutes");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/dashboard/coding-streak/focus-session", {
        method: "POST",
        body: JSON.stringify({ minutes: mins, note: note || undefined }),
      });
      onLogged(mins);
      setNote("");
      notify.success(`Logged ${mins} min of focus time`);
    } catch (err) {
      notify.error("Couldn't log session", err instanceof ApiError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        type="number"
        min={1}
        max={1440}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        leftSlot={<Clock size={14} />}
        className="sm:w-28"
        aria-label="Minutes"
      />
      <Input
        placeholder="What did you work on? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1"
      />
      <Button size="sm" leftIcon={<Plus size={14} />} onClick={handleLog} loading={saving}>
        Log session
      </Button>
    </div>
  );
}
