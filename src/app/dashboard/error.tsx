"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Card className="border-dashed px-8 py-16 text-center">
          <AlertTriangle size={24} className="mx-auto text-danger mb-3" />
          <p className="text-text-muted">Something went wrong on this page.</p>
          <p className="text-sm text-text-subtle mt-1">
            This is usually temporary — try again.
          </p>
          <Button className="mt-4" size="sm" onClick={() => reset()}>
            Try again
          </Button>
        </Card>
      </div>
    </DashboardShell>
  );
}
