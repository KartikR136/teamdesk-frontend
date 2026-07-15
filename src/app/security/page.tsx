import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Database,
  KeyRound,
  MailCheck,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const THREAT_MODEL_URL =
  "https://github.com/KartikR136/teamdesk-frontend/blob/main/THREAT_MODEL.md";
const TESTING_URL =
  "https://github.com/KartikR136/teamdesk-frontend/blob/main/TESTING.md";
const ARCHITECTURE_URL =
  "https://github.com/KartikR136/teamdesk-frontend/blob/main/ARCHITECTURE.md";

const PRINCIPLES = [
  {
    icon: Database,
    title: "Tenant Isolation",
    description:
      "organizationId is denormalized onto every resource — issues, projects, comments, activity log — so every read/write query filters by org directly. No query can leak cross-org data because a join was written wrong.",
  },
  {
    icon: UserCheck,
    title: "Role-Based Authorization",
    description:
      "Four ranked roles (VIEWER < MEMBER < MANAGER < ADMIN), enforced server-side on every request via requireRole — never inferred from the frontend.",
  },
  {
    icon: Lock,
    title: "Server-Side Organization Resolution",
    description:
      "Org context is always derived from the resource being accessed, never trusted from a client-supplied field. A request to mutate issue X re-derives which org X belongs to from the database, every time.",
  },
  {
    icon: KeyRound,
    title: "Identity-Only Tokens",
    description:
      "JWTs carry only a user id, never a role. Roles are loaded fresh from the database on every request, so a stale or forged token can never grant a permission the user doesn't currently have.",
  },
  {
    icon: MailCheck,
    title: "Invitation Integrity",
    description:
      "Accepting an invitation requires the authenticated user's email to match the invitation's addressee exactly — an org admin can't accept an invite meant for someone else.",
  },
];

const ATTACK_MATRIX: {
  attack: string;
  protected: boolean;
  tested: boolean;
}[] = [
  {
    attack: "Cross-org IDOR (guessed resource ID)",
    protected: true,
    tested: true,
  },
  {
    attack: "Pagination cursor replay across orgs",
    protected: true,
    tested: true,
  },
  {
    attack: "Client-supplied cross-org escalation",
    protected: true,
    tested: true,
  },
  {
    attack: "Forged role claim in a signed JWT",
    protected: true,
    tested: true,
  },
  { attack: "Last-admin self-removal lockout", protected: true, tested: true },
  {
    attack: "Wrong-recipient invitation acceptance",
    protected: true,
    tested: true,
  },
];

export default function SecurityOverviewPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
      {/* Hero */}
      <div className="mb-14">
        <div className="flex items-center gap-2 text-primary mb-3">
          <ShieldCheck size={20} />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Security
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text mb-3">
          Security by architecture, not by convention.
        </h1>
        <p className="text-text-muted leading-relaxed">
          TeamDesk was designed around one invariant from day one:{" "}
          <strong className="text-text font-medium">
            no organization can ever access another organization&apos;s data.
          </strong>{" "}
          Every authorization decision below exists to make that provably true —
          not just asserted, but tested against real attack patterns.
        </p>
      </div>

      {/* Principles */}
      <section className="mb-14">
        <h2 className="text-sm font-semibold text-text-subtle uppercase tracking-wide mb-4">
          Security principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} className="p-4">
              <p.icon size={18} className="text-primary mb-2" />
              <p className="text-sm font-medium text-text mb-1">{p.title}</p>
              <p className="text-xs text-text-muted leading-relaxed">
                {p.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Attack matrix */}
      <section className="mb-14">
        <h2 className="text-sm font-semibold text-text-subtle uppercase tracking-wide mb-4">
          Attack matrix
        </h2>
        <Card>
          <CardHeader className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
            <span className="text-xs font-medium text-text-subtle uppercase tracking-wide">
              Attack
            </span>
            <span className="text-xs font-medium text-text-subtle uppercase tracking-wide">
              Protected
            </span>
            <span className="text-xs font-medium text-text-subtle uppercase tracking-wide">
              Tested
            </span>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {ATTACK_MATRIX.map((row) => (
              <div
                key={row.attack}
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3"
              >
                <span className="text-sm text-text">{row.attack}</span>
                <Badge variant={row.protected ? "success" : "danger"}>
                  {row.protected ? "Yes" : "No"}
                </Badge>
                <Badge variant={row.tested ? "success" : "danger"}>
                  {row.tested ? "Yes" : "No"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-xs text-text-subtle mt-2">
          Full detail on each vector — including the exact mechanism that blocks
          it, and one honestly-documented discrepancy found while building this
          page&apos;s underlying tests — in{" "}
          <a
            href={THREAT_MODEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover transition-colors"
          >
            THREAT_MODEL.md
          </a>
          .
        </p>
      </section>

      {/* Verification */}
      <section className="mb-14">
        <h2 className="text-sm font-semibold text-text-subtle uppercase tracking-wide mb-4">
          How it&apos;s verified
        </h2>
        <Card className="p-4">
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li>
              <span className="text-text font-medium">Automated tests</span> —
              every scenario in the attack matrix above has a dedicated,
              automated regression test, not just a manual demonstration.
            </li>
            <li>
              <span className="text-text font-medium">
                Hostile-tenant methodology
              </span>{" "}
              — the test suite treats an authenticated user of one organization
              deliberately probing another&apos;s boundaries as a first-class
              test persona, not an edge case.
            </li>
            <li>
              <span className="text-text font-medium">
                Reproducible attack scenarios
              </span>{" "}
              — the same scenarios above are also runnable live, against real
              seeded data, from the authenticated Security Console.
            </li>
          </ul>
          <p className="text-xs text-text-subtle mt-3 pt-3 border-t border-border">
            Full methodology and audit trail in{" "}
            <a
              href={TESTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition-colors"
            >
              TESTING.md
            </a>
            . System design and trade-offs in{" "}
            <a
              href={ARCHITECTURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition-colors"
            >
              ARCHITECTURE.md
            </a>
            .
          </p>
        </Card>
      </section>

      {/* CTA */}
      <section className="text-center border-t border-border pt-10">
        <p className="text-sm text-text-muted mb-4">
          Want to explore the interactive attack demonstrations yourself?
        </p>
        <Link href="/login">
          <Button variant="secondary">Sign in to the Security Console</Button>
        </Link>
      </section>
    </main>
  );
}
