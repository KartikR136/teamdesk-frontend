"use client";

import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is TeamDesk really multi-tenant secure?",
    a: "Yes — and we prove it rather than just say it. organizationId is denormalized onto every resource in the database. Every read and list query filters by it directly. A live Attack Console runs six distinct attack scenarios (cross-org IDOR, cursor replay, wrong-recipient invitation, role escalation, etc.) against real seeded data and shows the results. The threat model is public and documents known trade-offs honestly.",
  },
  {
    q: "What is the Decision Log and why does it matter?",
    a: "The Decision Log captures every significant engineering choice with its full context: the problem, alternatives considered, the chosen solution, trade-offs accepted, and downstream consequences. Status transitions (Draft → Accepted → Superseded) are each their own audit event. The goal is 'explainable engineering' — so the reasoning behind a decision doesn't disappear when the author leaves.",
  },
  {
    q: "What roles are available and what can each do?",
    a: "Four roles: Viewer (read-only), Member (create and edit issues, add comments), Manager (reserved for future permission expansions), Admin (full org management — invite/remove members, change roles, create/delete projects). All role checks happen server-side; the frontend role display is purely cosmetic.",
  },
  {
    q: "How does authentication work?",
    a: "Session cookies are httpOnly, not stored in localStorage or accessible to JavaScript. Access tokens are short-lived; refresh token rotation handles session extension automatically. The API layer retries exactly once after a 401 — with a single-flight guard so concurrent requests don't each trigger a separate refresh.",
  },
  {
    q: "Can I use TeamDesk for multiple organizations?",
    a: "Yes. One account can belong to any number of organizations. Switch between them instantly from the header. Each organization's data is completely isolated — no shared projects, no shared members, no possibility of cross-org data access.",
  },
  {
    q: "What's the tech stack?",
    a: "Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Framer Motion, Radix UI. Backend: Node.js/TypeScript, Express, Prisma ORM, PostgreSQL (Neon), Redis (Upstash). Deployments: Vercel (frontend) + Render (backend).",
  },
  {
    q: "Is there a free tier?",
    a: "TeamDesk is free for everyone — every project, issue, and the full Decision Log, with no seat limits, usage caps, or feature gating.",
  },
];

export function FAQSection() {
  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-14">
          {/* Left label */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text mb-4">
              Common questions
            </h2>
            <p className="text-base text-text-muted leading-relaxed">
              Still have a question? The source code and threat model are
              public.
            </p>
          </motion.div>

          {/* Right accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion.Root type="single" collapsible className="space-y-2">
              {FAQS.map(({ q, a }) => (
                <Accordion.Item
                  key={q}
                  value={q}
                  className="rounded-xl border border-border bg-surface overflow-hidden"
                >
                  <Accordion.Header>
                    <Accordion.Trigger
                      className={cn(
                        "flex w-full items-center justify-between px-5 py-4",
                        "text-sm font-semibold text-text text-left",
                        "hover:bg-surface-hover transition-colors duration-fast",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring/40",
                        "[&[data-state=open]]:bg-surface-hover",
                        "group",
                      )}
                    >
                      {q}
                      <ChevronDown
                        size={16}
                        className="text-text-subtle shrink-0 transition-transform duration-normal group-data-[state=open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content
                    className={cn(
                      "overflow-hidden text-sm text-text-muted",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out",
                      "duration-normal",
                    )}
                  >
                    <div className="px-5 pb-5 pt-1 leading-relaxed border-t border-border">
                      {a}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
