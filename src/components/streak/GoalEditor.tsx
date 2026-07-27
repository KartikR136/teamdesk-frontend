"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useNotify } from "@/lib/notifications";
import { apiFetch, ApiError } from "@/lib/api";

export function GoalEditor({
  weeklyCommitGoal,
  weeklyIssueGoal,
  onSaved,
}: {
  weeklyCommitGoal: number;
  weeklyIssueGoal: number;
  onSaved: (goals: { weeklyCommitGoal: number; weeklyIssueGoal: number }) => void;
}) {
  const notify = useNotify();
  const [commitGoal, setCommitGoal] = useState(String(weeklyCommitGoal));
  const [issueGoal, setIssueGoal] = useState(String(weeklyIssueGoal));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const weeklyCommitGoal = Number(commitGoal);
    const weeklyIssueGoal = Number(issueGoal);
    if (!Number.isFinite(weeklyCommitGoal) || weeklyCommitGoal < 1) {
      notify.error("Commit goal must be at least 1");
      return;
    }
    if (!Number.isFinite(weeklyIssueGoal) || weeklyIssueGoal < 1) {
      notify.error("Issue goal must be at least 1");
      return;
    }

    setSaving(true);
    try {
      const updated = await apiFetch<{ weeklyCommitGoal: number; weeklyIssueGoal: number }>(
        "/api/dashboard/coding-streak/goals",
        { method: "PATCH", body: JSON.stringify({ weeklyCommitGoal, weeklyIssueGoal }) },
      );
      onSaved(updated);
      notify.success("Goals updated");
    } catch (err) {
      notify.error("Couldn't save goals", err instanceof ApiError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-text-muted">Weekly commit goal</span>
          <Input
            type="number"
            min={1}
            max={500}
            value={commitGoal}
            onChange={(e) => setCommitGoal(e.target.value)}
          />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-text-muted">Weekly issue goal</span>
          <Input
            type="number"
            min={1}
            max={200}
            value={issueGoal}
            onChange={(e) => setIssueGoal(e.target.value)}
          />
        </label>
      </div>
      <Button size="sm" variant="secondary" leftIcon={<Target size={14} />} onClick={handleSave} loading={saving}>
        Save goals
      </Button>
    </div>
  );
}
