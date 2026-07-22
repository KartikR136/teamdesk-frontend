import Link from "next/link";
import { FileText, FlaskConical, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const PROOF_POINTS = [
  {
    icon: ShieldAlert,
    title: "Threat model",
    description:
      "Every attack vector TeamDesk defends against, the exact mechanism that blocks it, and one honestly-documented discrepancy found while building it.",
  },
  {
    icon: FlaskConical,
    title: "Testing methodology",
    description:
      "A hostile tenant — an authenticated user probing another organization's boundaries — is treated as a first-class test persona, not an edge case.",
  },
  {
    icon: FileText,
    title: "Live security overview",
    description:
      "The same threat model, presented in-product, plus an interactive Attack Console that runs real attack scenarios against real seeded data.",
  },
];

/**
 * Reuses the exact framing already written in the project's own README
 * ("Proof, not just claims") — this is real, already-true content, not
 * marketing copy invented for this page. The goal here is surfacing it
 * to a visitor who will never read the README, not rewriting the claim.
 */
export function ProofSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
      <div className="max-w-lg mb-8">
        <h2 className="text-xl font-semibold text-text tracking-tight">
          Proof, not just claims
        </h2>
        <p className="text-sm text-text-muted mt-2 leading-relaxed">
          Most tools describe their security in a paragraph on a pricing
          page. TeamDesk documents it the way an engineering team would
          document it for each other.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {PROOF_POINTS.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="shadow-none">
            <CardContent className="p-5">
              <Icon size={20} className="text-text-muted mb-3" />
              <h3 className="text-sm font-semibold text-text mb-1.5">
                {title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link href="/security">
        <Button variant="secondary">Read the full security overview</Button>
      </Link>
    </section>
  );
}
