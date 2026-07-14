"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Never swallow silently — this is the last line of defense before a
    // user sees a blank/crashed screen. Upgrade to a real logging service
    // later; console.error is the honest minimum for now.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <AlertTriangle size={28} className="mx-auto text-danger mb-3" />
        <h1 className="text-lg font-semibold text-text">Something went wrong</h1>
        <p className="text-sm text-text-muted mt-1.5">
          An unexpected error occurred. Try reloading — if this keeps
          happening, please let us know.
        </p>
        <Button className="mt-5" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
