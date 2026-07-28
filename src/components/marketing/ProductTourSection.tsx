"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ScrollText,
  ShieldAlert,
  Activity,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Tab definitions ──────────────────────────────────────────────────
   Four real surfaces of the product, each rebuilt here as a lightweight
   static mock (no screenshots) so it stays crisp at any size and never
   drifts out of sync with the actual theme tokens.                    */

type TabId = "dashboard" | "decisions" | "security" | "activity";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} /> },
  { id: "decisions", label: "Decision Log", icon: <ScrollText size={14} /> },
  { id: "security", label: "Attack Console", icon: <ShieldAlert size={14} /> },
  { id: "activity", label: "Activity Feed", icon: <Activity size={14} /> },
];

/* ── Dashboard mock ───────────────────────────────────────────────── */
function DashboardMock() {
  const stats = [
    { label: "Open issues", value: "23", delta: "-4", up: false },
    { label: "In review", value: "6", delta: "+2", up: true },
    { label: "Coding streak", value: "9d", delta: "+1", up: true },
    { label: "Build health", value: "98%", delta: "+0.4%", up: true },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3 p-4 sm:p-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <p className="text-xs text-text-muted mb-1.5">{s.label}</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-text tracking-tight">
              {s.value}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                s.up ? "text-success" : "text-danger",
              )}
            >
              {s.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {s.delta}
            </span>
          </div>
        </div>
      ))}
      <div className="sm:col-span-2 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-muted mb-3">Weekly throughput</p>
        <div className="flex items-end gap-1.5 h-16">
          {[40, 65, 50, 80, 60, 90, 72].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-primary/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Decision log mock ────────────────────────────────────────────── */
function DecisionsMock() {
  const decisions = [
    {
      title: "Adopt cursor pagination over offset",
      status: "Accepted",
      tone: "success" as const,
    },
    {
      title: "Cache roles in Redis, not the JWT",
      status: "Accepted",
      tone: "success" as const,
    },
    {
      title: "Defer CSRF double-submit rollout",
      status: "Deferred",
      tone: "warning" as const,
    },
    {
      title: "Shared rate-limit bucket per org",
      status: "Proposed",
      tone: "info" as const,
    },
  ];
  const dot: Record<string, string> = {
    success: "bg-success",
    warning: "bg-warning",
    info: "bg-info",
  };
  return (
    <div className="p-4 sm:p-5 space-y-2">
      {decisions.map((d) => (
        <div
          key={d.title}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3"
        >
          <span className={cn("h-2 w-2 rounded-full shrink-0", dot[d.tone])} />
          <span className="flex-1 text-[13px] text-text truncate">
            {d.title}
          </span>
          <span className="text-[11px] text-text-muted shrink-0">
            {d.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Attack console mock ──────────────────────────────────────────── */
function SecurityMock() {
  const runs = [
    { label: "Cross-org cursor replay", ms: 118 },
    { label: "IDOR on issue/comment", ms: 94 },
    { label: "Wrong-recipient invite accept", ms: 142 },
    { label: "Role token forgery", ms: 87 },
  ];
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">
          Last run · 14/14 blocked
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-success">
          <CheckCircle2 size={13} /> Passing
        </span>
      </div>
      <div className="space-y-2">
        {runs.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-mono"
          >
            <XCircle size={14} className="text-danger shrink-0" />
            <span className="flex-1 text-[12px] text-text truncate">
              {r.label}
            </span>
            <span className="text-[11px] text-text-subtle shrink-0">
              {r.ms}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Activity feed mock ───────────────────────────────────────────── */
function ActivityMock() {
  const events = [
    {
      who: "Priya",
      what: "moved Auth token rotation to In Review",
      when: "2m ago",
    },
    {
      who: "Dev",
      what: "logged decision: defer CSRF rollout",
      when: "18m ago",
    },
    {
      who: "System",
      what: "blocked cross-org access attempt",
      when: "41m ago",
    },
    {
      who: "Marcus",
      what: "invited teammate to Infra project",
      when: "1h ago",
    },
  ];
  return (
    <div className="p-4 sm:p-5 space-y-0.5">
      {events.map((e, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg px-3.5 py-2.5 hover:bg-surface-hover/60"
        >
          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <p className="flex-1 text-[13px] text-text leading-snug">
            <span className="font-medium">{e.who}</span>{" "}
            <span className="text-text-muted">{e.what}</span>
          </p>
          <span className="flex items-center gap-1 text-[11px] text-text-subtle shrink-0">
            <Clock3 size={11} /> {e.when}
          </span>
        </div>
      ))}
    </div>
  );
}

const PANELS: Record<TabId, React.ReactNode> = {
  dashboard: <DashboardMock />,
  decisions: <DecisionsMock />,
  security: <SecurityMock />,
  activity: <ActivityMock />,
};

const COPY: Record<TabId, { eyebrow: string; title: string; body: string }> = {
  dashboard: {
    eyebrow: "Dashboard",
    title: "One screen, the whole team's pulse",
    body: "Open issues, review load, build health, and streaks — the numbers you'd otherwise be pinging three people for.",
  },
  decisions: {
    eyebrow: "Decision Log",
    title: "The 'why' doesn't live in Slack anymore",
    body: "Every architectural call — proposed, accepted, or deferred — with its trade-offs written down where the next engineer will actually find them.",
  },
  security: {
    eyebrow: "Attack Console",
    title: "We don't just claim it's secure. We show the run.",
    body: "Fourteen real attack scenarios, replayed against your own tenant boundary, with pass/fail and timing on every single one.",
  },
  activity: {
    eyebrow: "Activity Feed",
    title: "Every change, attributed, in order",
    body: "Not just for admins — the whole team sees who did what, including the security events the system caught on its own.",
  },
};

export function ProductTourSection() {
  const [active, setActive] = useState<TabId>("dashboard");

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <div className="max-w-xl mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Inside TeamDesk
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text mb-4">
          A quick look around
        </h2>
        <p className="text-base text-text-muted leading-relaxed">
          Four screens your team will actually live in, day to day.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
        {/* Tab rail */}
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap text-left transition-colors shrink-0",
                active === tab.id
                  ? "bg-primary-subtle text-primary"
                  : "text-text-muted hover:bg-surface-hover hover:text-text",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <div className="hidden lg:block mt-4 pt-4 border-t border-border">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle mb-2">
                  {COPY[active].eyebrow}
                </p>
                <h3 className="text-sm font-semibold text-text mb-2 leading-snug">
                  {COPY[active].title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {COPY[active].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Panel */}
        <div className="relative rounded-2xl border border-border bg-background-subtle overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-danger/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
            </div>
            <span className="text-[11px] font-mono text-text-subtle ml-2">
              teamdesk.app/dashboard/{active}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {PANELS[active]}
            </motion.div>
          </AnimatePresence>

          {/* Mobile-only copy (rail copy is hidden below lg) */}
          <div className="lg:hidden border-t border-border px-4 py-4">
            <h3 className="text-sm font-semibold text-text mb-1.5">
              {COPY[active].title}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {COPY[active].body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
