"use client";

import { motion, type Variants } from "framer-motion";
import {
  ListTodo,
  ShieldCheck,
  ScrollText,
  Users,
  BarChart3,
  Bell,
  Search,
  GitBranch,
} from "lucide-react";

const FEATURES = [
  {
    icon: ListTodo,
    title: "Issues & Projects",
    description:
      "Organize work into projects, track issues with status and priority, and discuss inline with threaded comments.",
    accent: "bg-primary-subtle text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Verified Security",
    description:
      "Every org's data is isolated at the query level. Roles enforced on every request. A live Attack Console proves it — not just describes it.",
    accent: "bg-success-subtle text-success",
    featured: true,
  },
  {
    icon: ScrollText,
    title: "Decision Log",
    description:
      "Document every architectural choice — the problem, alternatives, trade-offs, and the chosen path. Engineering memory that doesn't live in Slack.",
    accent: "bg-warning-subtle text-warning",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Four roles — Viewer, Member, Manager, Admin — with permissions enforced server-side on every route, never trusted from the client.",
    accent: "bg-info-subtle text-info",
  },
  {
    icon: BarChart3,
    title: "Activity Audit Trail",
    description:
      "Every meaningful change your team makes is logged — who did what, when. Not just for admins; the whole team can see the history.",
    accent: "bg-primary-subtle text-primary",
  },
  {
    icon: Bell,
    title: "Invitations & Onboarding",
    description:
      "Invite teammates by email with role pre-assignment. Invitation acceptance is guarded — can't be replayed or redirected to the wrong org.",
    accent: "bg-success-subtle text-success",
  },
  {
    icon: Search,
    title: "Fast Filtering",
    description:
      "Sort and filter issues, decisions, and members client-side without a full-page reload. Search loaded pages instantly.",
    accent: "bg-warning-subtle text-warning",
  },
  {
    icon: GitBranch,
    title: "Multi-Org Support",
    description:
      "One account, multiple organizations. Switch context instantly from the header. Each org is completely isolated from every other.",
    accent: "bg-info-subtle text-info",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28"
    >
      {/* Header */}
      <div className="max-w-xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Features
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text mb-4">
          Everything your team needs.{" "}
          <span className="text-text-muted font-normal">Nothing it doesn&apos;t.</span>
        </h2>
        <p className="text-base text-text-muted leading-relaxed">
          Built for engineering teams who care about correctness as much as velocity.
        </p>
      </div>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {FEATURES.map(({ icon: Icon, title, description, accent, featured }) => (
          <motion.div
            key={title}
            variants={cardVariant}
            className={`group relative rounded-2xl border p-6 transition-all duration-normal ${
              featured
                ? "border-primary/30 bg-primary-subtle/30 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5"
                : "border-border bg-surface hover:border-border-hover hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {featured && (
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-pill">
                  Differentiator
                </span>
              </div>
            )}
            <div
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-4 ${accent}`}
            >
              <Icon size={18} />
            </div>
            <h3 className="text-sm font-semibold text-text mb-2 leading-snug">
              {title}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
