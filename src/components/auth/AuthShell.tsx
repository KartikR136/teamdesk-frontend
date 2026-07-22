import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Split-panel auth shell.
 * Left panel (hidden on mobile): dark brand panel with logo and tagline.
 * Right panel: clean form area.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Brand panel (desktop only) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col relative overflow-hidden bg-stone-900">
        {/* Subtle texture orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-success/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="var(--primary)" />
              <rect x="5" y="8" width="18" height="3.5" rx="1.75" fill="white" />
              <rect x="11.25" y="8" width="5.5" height="13" rx="2" fill="white" />
            </svg>
            <span className="text-base font-semibold text-white tracking-tight">
              TeamDesk
            </span>
          </Link>

          {/* Central tagline */}
          <div className="flex-1 flex flex-col justify-center max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
              Engineering workspace
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
              Built for teams who care about the why, not just the what.
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Track projects, log decisions with full context, and prove your
              security posture — all in one place.
            </p>
          </div>

          {/* Bottom trust signals */}
          <div className="space-y-2.5">
            {[
              "Production-grade multi-tenant isolation",
              "Decision Log with full audit trail",
              "Role-based access on every endpoint",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-stone-400">
                <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile-only logo */}
        <div className="lg:hidden px-6 pt-7">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="var(--primary)" />
              <rect x="5" y="8" width="18" height="3.5" rx="1.75" fill="white" />
              <rect x="11.25" y="8" width="5.5" height="13" rx="2" fill="white" />
            </svg>
            <span className="text-sm font-semibold text-text tracking-tight group-hover:text-primary transition-colors">
              TeamDesk
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px]">
            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-text tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>
            </div>

            {/* Form content */}
            <div className="space-y-1">
              {children}
            </div>

            {/* Footer link */}
            {footer && (
              <p className="text-center text-sm text-text-muted mt-6">
                {footer}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
