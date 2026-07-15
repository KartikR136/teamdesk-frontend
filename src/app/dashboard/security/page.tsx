"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Play } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Security</h1>
        <p className="text-sm text-text-subtle mt-1">
          Live demonstrations of the authorization boundary described in{" "}
          <code className="font-mono text-xs">THREAT_MODEL.md</code>. Each
          scenario performs a real attack attempt against seeded demo data
          through the actual API — nothing here is mocked.
        </p>
      </div>

      {loadError && (
        <Card className="border-danger/40">
          <CardContent>
            <p className="text-sm text-danger">{loadError}</p>
          </CardContent>
        </Card>
      )}

      {!scenarios && !loadError && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {scenarios?.map((scenario) => {
        const result = results[scenario.id];
        const isRunning = running[scenario.id];

        return (
          <Card key={scenario.id}>
            <CardHeader className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">
                  {scenario.title}
                </p>
              </div>
              {result && (
                <Badge variant={result.passed ? "success" : "danger"}>
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
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-text-muted">{scenario.description}</p>

              {result && (
                <div className="text-xs space-y-1 pt-2 border-t border-border">
                  <p className="text-text-subtle">
                    <span className="font-medium text-text">Expected: </span>
                    {result.expectedOutcome}
                  </p>
                  <p className="text-text-subtle">
                    <span className="font-medium text-text">Actual: </span>
                    {result.actualOutcome}
                  </p>
                  <p className="text-text-subtle font-mono">
                    {result.mechanism}
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runScenario(scenario.id)}
                disabled={isRunning}
              >
                <span className="flex items-center gap-1.5">
                  <Play size={14} />
                  {isRunning ? "Running…" : "Run Attack"}
                </span>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
