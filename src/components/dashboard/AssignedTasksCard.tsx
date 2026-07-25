"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, AlertTriangle, Check } from "lucide-react";
import { WidgetCard, type WidgetStatus } from "./WidgetCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AssignedTask, DashboardHomeResponse } from "@/mock/dashboard";
import { apiFetch, isAbortError } from "@/lib/api";
import type { IssuePriority } from "@/types";
import { cn } from "@/lib/utils";

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

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatDue(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const d = new Date(dueDate);
  const diffDays = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  return `Due in ${diffDays}d`;
}

function TaskRow({
  task,
  index,
  onComplete,
  completing,
}: {
  task: AssignedTask;
  index: number;
  onComplete: (taskId: string) => void;
  completing: boolean;
}) {
  const router = useRouter();
  const overdue = isOverdue(task.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
    >
      {/* Not a <Link> around the whole card: the "mark done" button
          needs its own click target, and a button nested inside an <a>
          is invalid HTML and unreliable to click. Row navigation happens
          via router.push on the card's own onClick instead, and the
          complete button stops that click from also firing. */}
      <div
        role="link"
        tabIndex={0}
        onClick={() =>
          router.push(`/dashboard/projects/${task.projectId}/issues/${task.id}`)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter")
            router.push(
              `/dashboard/projects/${task.projectId}/issues/${task.id}`,
            );
        }}
        className="rounded-lg border border-border p-3 cursor-pointer transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm font-medium text-text leading-snug">
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={PRIORITY_VARIANT[task.priority]}>
              {task.priority}
            </Badge>
            <button
              type="button"
              title="Mark as done"
              aria-label="Mark as done"
              disabled={completing}
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
              className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full border border-border",
                "text-text-subtle transition-colors duration-fast",
                "hover:border-success hover:bg-success-subtle hover:text-success",
                "disabled:opacity-50 disabled:pointer-events-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <Check size={12} />
            </button>
          </div>
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
      </div>
    </motion.div>
  );
}

export function AssignedTasksCard() {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);
  // Bumped to force the mount effect below to re-run when the retry
  // button is clicked, without duplicating the fetch logic in two places.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setStatus("loading");
      try {
        const response = await apiFetch<DashboardHomeResponse>(
          "/api/dashboard/home",
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const data = response.assignedTasks;
        setTasks(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, [reloadToken]);

  async function handleComplete(taskId: string) {
    setCompletingId(taskId);
    const previous = tasks;
    // Optimistic removal: the backend's assigned-tasks query already
    // excludes DONE issues, so a completed task belongs gone from this
    // list regardless of exactly when the PATCH round-trip resolves.
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiFetch(`/api/issues/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DONE" }),
      });
    } catch {
      setTasks(previous);
    } finally {
      setCompletingId(null);
    }
  }

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate)).length;
  const dueTodayCount = tasks.filter(
    (t) => !isOverdue(t.dueDate) && isDueToday(t.dueDate),
  ).length;
  // Derived at render time, not via a separate effect: completing the
  // last remaining task should flip straight to the empty state.
  const effectiveStatus: WidgetStatus =
    status === "ready" && tasks.length === 0 ? "empty" : status;

  return (
    <WidgetCard
      title="My Assigned Tasks"
      icon={<ListChecks size={15} />}
      status={effectiveStatus}
      onRetry={() => setReloadToken((n) => n + 1)}
      headerAction={
        effectiveStatus === "ready" &&
        (overdueCount > 0 || dueTodayCount > 0) ? (
          <div className="flex items-center gap-1.5">
            {overdueCount > 0 && (
              <Badge variant="danger">{overdueCount} overdue</Badge>
            )}
            {dueTodayCount > 0 && (
              <Badge variant="warning">{dueTodayCount} due today</Badge>
            )}
          </div>
        ) : undefined
      }
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
      <AnimatePresence initial={false}>
        {tasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            index={i}
            onComplete={handleComplete}
            completing={completingId === task.id}
          />
        ))}
      </AnimatePresence>
    </WidgetCard>
  );
}
