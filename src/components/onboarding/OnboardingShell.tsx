import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const STEPS = ["Workspace", "Invite team", "First project"] as const;

export function OnboardingShell({
  activeStep,
  children,
}: {
  activeStep: number;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-sm px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="7" fill="var(--primary)" />
            <rect x="5" y="8" width="18" height="3.5" rx="1.75" fill="white" />
            <rect x="11.25" y="8" width="5.5" height="13" rx="2" fill="white" />
          </svg>
          <span className="text-sm font-semibold tracking-tight text-text group-hover:text-primary transition-colors">
            TeamDesk
          </span>
        </Link>
      </div>

      <div className="flex items-start justify-center px-6 py-14">
        <div className="w-full max-w-md">
          {/* Step progress */}
          <div className="mb-8">
            {/* Labelled steps */}
            <div className="flex items-center gap-0 mb-3">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      "transition-all duration-normal",
                      i < activeStep
                        ? "bg-primary text-white"
                        : i === activeStep
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-surface-hover text-text-subtle border border-border",
                    )}>
                      {i < activeStep ? "✓" : i + 1}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium mt-1 whitespace-nowrap",
                      i <= activeStep ? "text-text" : "text-text-subtle",
                    )}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-px mx-2 mt-[-12px] transition-colors duration-normal",
                      i < activeStep ? "bg-primary" : "bg-border",
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
