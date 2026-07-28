"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  PlayCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ScenarioSummary {
  id: string;
  title: string;
  description: string;
}

interface ScenarioResult {
  id: string;
  title: string;
  expectedOutcome: string;
  actualOutcome: string;
  passed: boolean;
  mechanism: string;
}

export default function SecurityPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[] | null>(null);
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/_demo/attack-scenarios`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as ScenarioSummary[];
        if (!cancelled) setScenarios(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load scenarios",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runScenario(id: string) {
    setRunning((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(
        `${API_URL}/api/_demo/attack-scenarios/${id}/run`,
        { method: "POST", credentials: "include" },
      );
      const data = (await res.json()) as ScenarioResult;
      setResults((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [id]: {
          id,
          title: id,
          expectedOutcome: "—",
          actualOutcome: err instanceof Error ? err.message : "Request failed",
          passed: false,
          mechanism: "Request to the attack console itself failed.",
        },
      }));
    } finally {
      setRunning((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function runAll() {
    if (!scenarios) return;
    setRunningAll(true);
    for (const s of scenarios) {
      await runScenario(s.id);
    }
    setRunningAll(false);
  }

  const total = scenarios?.length ?? 0;
  const ranCount = Object.keys(results).length;
  const passedCount = Object.values(results).filter((r) => r.passed).length;
  const anyRunning = useMemo(
    () => Object.values(running).some(Boolean),
    [running],
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center">
              <Lock size={15} className="text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-text">
              Attack Console
            </h1>
          </div>
          <p className="text-sm text-text-muted leading-relaxed max-w-xl">
            Live demonstrations of the authorization boundary described in{" "}
            <code className="font-mono text-xs bg-surface-hover px-1 py-0.5 rounded">
              THREAT_MODEL.md
            </code>
            . Each scenario is a real attack against seeded demo data through
            the actual API — nothing here is mocked.
          </p>
        </div>

        {scenarios && scenarios.length > 0 && (
          <Button
            onClick={runAll}
            disabled={runningAll || anyRunning}
            leftIcon={
              runningAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PlayCircle size={14} />
              )
            }
          >
            {runningAll ? "Running all…" : "Run all scenarios"}
          </Button>
        )}
      </div>

      {/* Summary strip */}
      {scenarios && scenarios.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-muted mb-1">Scenarios</p>
            <p className="text-xl font-semibold text-text tracking-tight">
              {total}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-muted mb-1">Run so far</p>
            <p className="text-xl font-semibold text-text tracking-tight">
              {ranCount}/{total}
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border p-4",
              ranCount > 0 && passedCount === ranCount
                ? "border-success/30 bg-success-subtle/40"
                : "border-border bg-surface",
            )}
          >
            <p className="text-xs text-text-muted mb-1">Blocked</p>
            <p
              className={cn(
                "text-xl font-semibold tracking-tight",
                ranCount > 0 && passedCount === ranCount
                  ? "text-success"
                  : "text-text",
              )}
            >
              {passedCount}/{ranCount || total}
            </p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-danger/40 bg-danger-subtle/30 p-4">
          <p className="text-sm text-danger">{loadError}</p>
        </div>
      )}

      {!scenarios && !loadError && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Scenario grid */}
      {scenarios && scenarios.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {scenarios.map((scenario, i) => {
            const result = results[scenario.id];
            const isRunning = running[scenario.id];

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.3 }}
                className={cn(
                  "flex flex-col rounded-xl border bg-surface p-4",
                  result
                    ? result.passed
                      ? "border-success/30"
                      : "border-danger/40"
                    : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-text leading-snug">
                    {scenario.title}
                  </p>
                  {result && (
                    <Badge
                      variant={result.passed ? "success" : "danger"}
                      className="shrink-0"
                    >
                      <span className="flex items-center gap-1">
                        {result.passed ? (
                          <ShieldCheck size={12} />
                        ) : (
                          <ShieldAlert size={12} />
                        )}
                        {result.passed ? "Blocked" : "Not blocked"}
                      </span>
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-text-muted leading-relaxed mb-3 flex-1">
                  {scenario.description}
                </p>

                {result && (
                  <div className="text-xs space-y-1 mb-3 pt-3 border-t border-border">
                    <p className="text-text-subtle">
                      <span className="font-medium text-text">Expected: </span>
                      {result.expectedOutcome}
                    </p>
                    <p className="text-text-subtle">
                      <span className="font-medium text-text">Actual: </span>
                      {result.actualOutcome}
                    </p>
                    <p className="text-text-subtle font-mono text-[11px] leading-relaxed">
                      {result.mechanism}
                    </p>
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => runScenario(scenario.id)}
                  disabled={isRunning || runningAll}
                  className="self-start"
                >
                  <span className="flex items-center gap-1.5">
                    {isRunning ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {isRunning ? "Running…" : "Run attack"}
                  </span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
