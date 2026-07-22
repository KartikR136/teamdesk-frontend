"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type WidgetStatus = "loading" | "empty" | "error" | "ready";

interface WidgetCardProps {
  title: string;
  icon?: ReactNode;
  /** Rendered top-right of the header — e.g. a "View all" link or count badge */
  headerAction?: ReactNode;
  status: WidgetStatus;
  /** Shown while status === "loading" — pass a skeleton matching this widget's real shape */
  skeleton: ReactNode;
  /** Shown while status === "empty" */
  emptyState: ReactNode;
  /** Shown while status === "error". Defaults to a standard retry block if omitted. */
  errorState?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
  className?: string;
  /** Widgets have deliberately different natural heights per the design
   * spec ("avoid making everything perfectly symmetrical") — pass
   * min-height utility classes per-widget rather than forcing a grid-wide
   * equal-height rule. */
  contentClassName?: string;
}

/**
 * Shared shell for every Developer Command Center widget. Centralizing
 * the loading/empty/error/ready branching here means:
 *   1. No widget can accidentally render blank space — the four states
 *      are exhaustive and this component is the only place that decides
 *      which one shows.
 *   2. Every widget's skeleton/empty/error visually matches every other
 *      widget's, rather than each one inventing its own spacing and tone.
 *   3. A future backend swap only changes what data flows into
 *      `status`/`children` — the shell itself never changes.
 */
export function WidgetCard({
  title,
  icon,
  headerAction,
  status,
  skeleton,
  emptyState,
  errorState,
  onRetry,
  children,
  className,
  contentClassName,
}: WidgetCardProps) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <CardTitle className="flex items-center gap-2">
          {icon && <span className="text-text-muted">{icon}</span>}
          {title}
        </CardTitle>
        {headerAction}
      </CardHeader>

      <CardContent className={cn("flex-1", contentClassName)}>
        {status === "loading" && skeleton}

        {status === "empty" && emptyState}

        {status === "error" &&
          (errorState ?? (
            <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
              <AlertTriangle size={22} className="text-danger" />
              <p className="text-sm text-text-muted">
                Couldn&amp;t load this — try again.
              </p>
              {onRetry && (
                <Button variant="ghost" size="sm" onClick={onRetry}>
                  <RefreshCw size={13} className="mr-1.5" />
                  Retry
                </Button>
              )}
            </div>
          ))}

        {status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
