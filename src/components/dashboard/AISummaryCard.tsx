"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { getMockDashboardData, type AISummary } from "@/mock/dashboard";
import { isAbortError } from "@/lib/api";

type Status = "loading" | "error" | "ready";

/**
 * Deliberately its own bespoke shell rather than WidgetCard — the spec
 * calls for this to read as "significantly more premium than every
 * other card" (animated gradient, larger type, a sparkle mark), which
 * would fight WidgetCard's neutral, repeatable header/content styling.
 * It still owns its own loading/error handling rather than skipping
 * it, so it never renders blank space either.
 */
export function AISummaryCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [summary, setSummary] = useState<AISummary | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setStatus("loading");
      try {
        // TODO: Replace with `await apiFetch<DashboardHomeResponse>(
        //   "/api/dashboard/home", { signal: controller.signal },
        // )` once the backend milestone lands — this component only
        // needs the `.aiSummary` slice of that response.
        await new Promise((r) => setTimeout(r, 350));
        if (controller.signal.aborted) return;
        setSummary(getMockDashboardData().aiSummary);
        setStatus("ready");
      } catch (err) {
        if (isAbortError(err)) return;
        setStatus("error");
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border shadow-md">
      {/* Animated gradient backdrop — subtle, slow-moving, never distracting */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      />
      <div className="relative bg-surface/60 backdrop-blur-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/15 text-primary">
            <Sparkles size={14} />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-text">
            {summary?.headline ?? "Today's Focus"}
          </h2>
        </div>

        {status === "loading" && (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-3 py-2">
            <AlertTriangle size={18} className="text-danger shrink-0" />
            <p className="text-sm text-text-muted flex-1">
              Couldn&amp;t generate today&amp;s summary.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatus("loading")}
            >
              <RefreshCw size={13} className="mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {status === "ready" && summary && (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-2"
          >
            {summary.bullets.map((bullet, i) => (
              <motion.li
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -6 },
                  show: { opacity: 1, x: 0 },
                }}
                className="flex items-start gap-2.5 text-sm text-text leading-snug"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {bullet}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
