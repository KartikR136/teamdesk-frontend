"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, AlertTriangle } from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMockDashboardData, type AssignedTask } from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";
import type { IssuePriority } from "@/types";

const PRIORITY_VARIANT: Record<
  IssuePriority,
  "neutral" | "warning" | "danger"
> = {
  LOW: "neutral",
  MEDIUM: "neutral",
  HIGH: "warning",
  URGENT: "danger",
};

const STATUS_LABEL: Record<AssignedTask["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

function formatDue(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const d = new Date(dueDate);
  const diffDays = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  return `Due in ${diffDays}d`;
}

function TaskRow({ task, index }: { task: AssignedTask; index: number }) {
  const overdue = isOverdue(task.dueDate);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      className="rounded-lg border border-border p-3"
      // Intentionally NOT role="button"/tabIndex/cursor-pointer: there is
      // no real onClick or keyboard handler here yet (see TODO below), so
      // marking this as interactive would announce a control to
      // keyboard/screen-reader users that does nothing on Enter/Space —
      // a worse experience than a plain, honestly non-interactive card.
      // TODO: once assigned tasks come from a real endpoint with a real
      // issue id, wrap this in a proper <Link href="/dashboard/projects/
      // :projectId/issues/:issueId"> — at that point the hover-lift
      // styling and keyboard activation should come back together, not
      // separately.
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium text-text leading-snug">
          {task.title}
        </p>
        <Badge variant={PRIORITY_VARIANT[task.priority]} className="shrink-0">
          {task.priority}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-subtle mb-2">
        <span>{task.projectName}</span>
        <span aria-hidden="true">·</span>
        <span>{STATUS_LABEL[task.status]}</span>
        {task.estimatePoints !== null && (
          <>
            <span aria-hidden="true">·</span>
            <span>{task.estimatePoints} pts</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${task.progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div
        className={
          overdue
            ? "flex items-center gap-1 text-xs font-medium text-danger"
            : "text-xs text-text-subtle"
        }
      >
        {overdue && <AlertTriangle size={12} />}
        {formatDue(task.dueDate)}
      </div>
    </motion.div>
  );
}

export function AssignedTasksCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [tasks, setTasks] = useState<AssignedTask[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` and read `.assignedTasks` from the response.
        await new Promise((r) => setTimeout(r, 300));
        if (controller.signal.aborted) return;
        const data = getMockDashboardData().assignedTasks;
        setTasks(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <WidgetCard
      title="My Assigned Tasks"
      icon={<ListChecks size={15} />}
      status={status}
      onRetry={() => setStatus("loading")}
      skeleton={
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-1.5 w-full mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={<ListChecks size={26} />}
          title="Nothing assigned to you"
          description="When issues get assigned to you, they'll show up here first."
          compact
        />
      }
      contentClassName="space-y-3"
    >
      {tasks.map((task, i) => (
        <TaskRow key={task.id} task={task} index={i} />
      ))}
    </WidgetCard>
  );
}
