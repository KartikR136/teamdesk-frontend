"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  UserPlus,
  Activity,
  RefreshCw,
  HistoryIcon,
} from "lucide-react";

const COLLAB_FEATURES = [
  {
    icon: MessageSquare,
    title: "Threaded comments",
    description:
      "Every issue has a comment thread. Edit or delete your own comments. Admins can moderate. The full conversation stays with the issue, not in Slack.",
  },
  {
    icon: UserPlus,
    title: "Role-aware invitations",
    description:
      "Invite teammates by email with a specific role pre-assigned. Invites expire, can't be replayed, and only the intended recipient can accept.",
  },
  {
    icon: Activity,
    title: "Live activity feed",
    description:
      "Every meaningful action — issue created, role changed, decision accepted — appears in the org-wide activity feed. No black boxes.",
  },
  {
    icon: RefreshCw,
    title: "Real-time role changes",
    description:
      "Promote, demote, or remove a member instantly. The role cache invalidates immediately — no waiting for a token to expire.",
  },
  {
    icon: HistoryIcon,
    title: "Decision history",
    description:
      "Decisions track who made the call, when it was accepted, and whether it was superseded — not just the current state.",
  },
];

const TIMELINE = [
  { time: "10:14 AM", actor: "Alice", action: "Created issue", detail: "Add rate limiting to /auth routes", type: "create" },
  { time: "10:31 AM", actor: "Bob",   action: "Changed status", detail: "In Progress → In Review", type: "update" },
  { time: "11:02 AM", actor: "Alice", action: "Commented", detail: "Looks good — one edge case to discuss", type: "comment" },
  { time: "11:18 AM", actor: "Carol", action: "Decision accepted", detail: "Shared Redis limiter bucket", type: "decision" },
  { time: "11:45 AM", actor: "Bob",   action: "Closed issue", detail: "Done ✓", type: "done" },
];

const TYPE_COLOR: Record<string, string> = {
  create:   "bg-primary",
  update:   "bg-warning",
  comment:  "bg-info",
  decision: "bg-success",
  done:     "bg-success",
};

export function CollaborationSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 border-t border-border">
      <div className="grid lg:grid-cols-2 gap-14 items-center">
        {/* Left — activity timeline mockup */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0, 0, 0.2, 1] }}
          className="order-2 lg:order-1"
        >
          <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Activity — Auth Platform</h3>
              <span className="text-xs text-text-subtle">Today</span>
            </div>
            <div className="p-5 space-y-4">
              {TIMELINE.map(({ time, actor, action, detail, type }, i) => (
                <motion.div
                  key={i}
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                >
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${TYPE_COLOR[type]}`} />
                    {i < TIMELINE.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      {/* Avatar initials */}
                      <div className="h-5 w-5 rounded-full bg-primary-subtle flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                        {actor[0]}
                      </div>
                      <span className="text-xs font-semibold text-text">{actor}</span>
                      <span className="text-xs text-text-muted">{action}</span>
                      <span className="text-[10px] text-text-subtle ml-auto">{time}</span>
                    </div>
                    <p className="text-xs text-text-muted pl-7">{detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right — copy */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Collaboration
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text mb-4">
              Your team&apos;s full history,{" "}
              <span className="text-text-muted font-normal">in one place.</span>
            </h2>
            <p className="text-base text-text-muted leading-relaxed mb-8">
              TeamDesk logs everything — comments, role changes, decisions
              accepted, issues closed. The feed is org-wide, not per-user, so
              the whole team sees the same truth.
            </p>
          </motion.div>

          <div className="space-y-5">
            {COLLAB_FEATURES.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                className="flex gap-4"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0, 0, 0.2, 1] }}
              >
                <div className="shrink-0 h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center text-primary">
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text mb-0.5">{title}</p>
                  <p className="text-sm text-text-muted leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
