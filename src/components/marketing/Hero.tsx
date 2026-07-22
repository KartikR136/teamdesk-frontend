"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  GitBranch,
  CheckCircle2,
  Circle,
  Clock,
  BarChart3,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* ── Animation variants ──────────────────────────────────────────────── */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/* ── Mini product preview ───────────────────────────────────────────── */
const MOCK_ISSUES = [
  { title: "Implement OAuth token rotation", status: "done", priority: "high" },
  { title: "Add cursor-based pagination to /issues", status: "in_progress", priority: "urgent" },
  { title: "Cross-org IDOR regression test", status: "in_review", priority: "high" },
  { title: "Decision log — status change audit event", status: "todo", priority: "medium" },
  { title: "Rate-limiter per-route granularity", status: "todo", priority: "low" },
];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  done:        { icon: <CheckCircle2 size={13} />, color: "text-success", label: "Done" },
  in_progress: { icon: <Zap size={13} />,          color: "text-warning",  label: "In Progress" },
  in_review:   { icon: <GitBranch size={13} />,    color: "text-info",    label: "In Review" },
  todo:        { icon: <Circle size={13} />,        color: "text-text-subtle", label: "Todo" },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-danger",
  high:   "bg-warning",
  medium: "bg-primary",
  low:    "bg-text-subtle",
};

function ProductPreview() {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* Glow backdrop */}
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/8 via-transparent to-transparent blur-2xl pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-danger/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
          </div>
          <div className="flex-1 mx-3">
            <div className="h-5 rounded-md bg-surface-hover border border-border flex items-center px-2.5 gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-[10px] text-text-subtle font-mono">
                teamdesk.app/dashboard/projects/auth-platform
              </span>
            </div>
          </div>
        </div>

        {/* App chrome — sidebar + content */}
        <div className="flex h-[340px]">
          {/* Mini sidebar */}
          <div className="w-36 border-r border-border bg-background/50 flex flex-col py-3 px-2 gap-0.5 shrink-0">
            {[
              { icon: <BarChart3 size={13} />, label: "Dashboard", active: false },
              { icon: <GitBranch size={13} />, label: "Projects", active: true },
              { icon: <Users size={13} />, label: "Members", active: false },
              { icon: <ShieldCheck size={13} />, label: "Security", active: false },
            ].map(({ icon, label, active }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium",
                  active
                    ? "bg-primary-subtle text-primary"
                    : "text-text-muted",
                )}
              >
                {icon}
                {label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {/* Content header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div>
                <div className="text-[11px] font-semibold text-text">Auth Platform</div>
                <div className="text-[10px] text-text-muted">5 issues</div>
              </div>
              <div className="h-5 px-2 rounded-md bg-primary text-white text-[10px] font-medium flex items-center">
                New issue
              </div>
            </div>

            {/* Issue list */}
            <div className="divide-y divide-border">
              {MOCK_ISSUES.map((issue, i) => {
                const status = STATUS_CONFIG[issue.status];
                return (
                  <motion.div
                    key={issue.title}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-hover/60 transition-colors"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.3, ease: "easeOut" }}
                  >
                    <span className={cn("shrink-0", status.color)}>{status.icon}</span>
                    <span className="flex-1 text-[11px] text-text truncate">{issue.title}</span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        PRIORITY_DOT[issue.priority],
                      )}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-text-subtle">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              All systems operational
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-text-subtle">
            <Clock size={10} />
            2 min ago
          </div>
        </div>
      </div>

      {/* Floating stat cards */}
      <motion.div
        className="absolute -bottom-4 -left-6 bg-surface border border-border rounded-xl shadow-lg px-3.5 py-2.5"
        initial={{ opacity: 0, y: 12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <p className="text-[10px] text-text-muted font-medium mb-0.5">Tenant isolation</p>
        <p className="text-lg font-bold text-success tracking-tight">Verified ✓</p>
      </motion.div>

      <motion.div
        className="absolute -top-4 -right-4 bg-surface border border-border rounded-xl shadow-lg px-3.5 py-2.5"
        initial={{ opacity: 0, y: -12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <p className="text-[10px] text-text-muted font-medium mb-0.5">Attack scenarios</p>
        <p className="text-lg font-bold text-text tracking-tight">14 blocked</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────── */
export function Hero() {
  return (
    <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — copy */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <Badge variant="subtle" dot className="mb-6">
              Engineering workspace for modern teams
            </Badge>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl sm:text-5xl font-semibold tracking-tight text-text leading-[1.08] mb-6"
          >
            Ship faster.{" "}
            <span className="text-primary">Stay accountable.</span>
            <br />
            Never lose context.
          </motion.h1>

          <motion.p
            variants={item}
            className="text-base sm:text-lg text-text-muted leading-relaxed mb-8 max-w-md"
          >
            TeamDesk is a focused project management platform for engineering
            teams — with production-grade multi-tenant security, a Decision Log
            that captures the why, and an audit trail that proves it.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
            <Link href="/signup">
              <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                Start for free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">
                Explore features
              </Button>
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-5 pt-6 border-t border-border"
          >
            {[
              { label: "Multi-tenant isolation", icon: <ShieldCheck size={14} className="text-success" /> },
              { label: "14 attack scenarios tested", icon: <CheckCircle2 size={14} className="text-primary" /> },
              { label: "No credit card required", icon: <Zap size={14} className="text-warning" /> },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-text-muted">
                {icon}
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — product preview */}
        <div className="hidden lg:block">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
