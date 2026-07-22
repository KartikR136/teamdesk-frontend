import { ListChecks, ScrollText, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Work",
    weight: "Core",
    description:
      "Organizations, projects, and issues with status, priority, and threaded comments — the daily loop your team actually lives in.",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    weight: "Differentiator",
    description:
      "Tenant isolation and role-based access enforced server-side on every request, with a public threat model and a live Attack Console proving it — not just describing it.",
  },
  {
    icon: ScrollText,
    title: "Decision Log",
    weight: "Signature",
    description:
      "Every engineering decision recorded with its context, alternatives, trade-offs, and reviewer — explainable engineering, not just a changelog.",
  },
  {
    icon: Users,
    title: "Collaboration",
    weight: "Supporting",
    description:
      "Members, roles, and invitations with a last-admin lockout, plus an audit trail of every meaningful change your team makes.",
  },
];

/**
 * Four cards, still weighted, not equal — per PRD 2 Section 6, Work is
 * core, Security is the named differentiator, Collaboration supports
 * both. Decision Log is added here as "Signature": it's a shipped,
 * tested, documented capability (Milestone 4), not a future concept, and
 * PRD 4's gap analysis identified this exact omission as the homepage's
 * highest-priority fix — the previous 3-card version under-sold the
 * product's own flagship differentiator.
 */
export function FeatureGrid() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, weight, description }) => (
          <Card key={title} className="shadow-none">
            <CardContent className="p-5">
              <Icon size={20} className="text-primary mb-3" />
              <div className="flex items-baseline gap-2 mb-1.5">
                <h3 className="text-sm font-semibold text-text">{title}</h3>
                <span className="text-xs text-text-subtle">{weight}</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
