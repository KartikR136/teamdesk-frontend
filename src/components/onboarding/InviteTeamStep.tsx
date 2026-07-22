"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/auth/FormField";
import { Badge } from "@/components/ui/Badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownCheckItem,
} from "@/components/ui/Dropdown";
import { ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import { ROLE_METADATA, ROLE_ORDER } from "@/lib/roles";
import type { Role } from "@/types";

/**
 * Step 2 of onboarding: invite teammates. Deliberately optional and
 * skippable — per PRD 1's "fast everyday workflows" and PRD 2's
 * first-time-experience guidance, forcing an invite before letting
 * someone see their own workspace would add friction with no safety
 * benefit. Calls the same POST /api/organizations/:id/invitations
 * endpoint InviteCard.tsx uses in the full Members page — not a new
 * backend surface, just a lighter, single-purpose form for this context.
 */
export function InviteTeamStep({
  organizationId,
  onContinue,
}: {
  organizationId: string;
  onContinue: () => void;
}) {
  const notify = useNotify();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [sending, setSending] = useState(false);
  const [invited, setInvited] = useState<{ email: string; role: Role }[]>([]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await apiFetch(`/api/organizations/${organizationId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setInvited((prev) => [...prev, { email, role }]);
      setEmail("");
      setRole("MEMBER");
    } catch {
      notify.error("Could not send invitation", "That email may already be invited or a member.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text tracking-tight mb-1.5">
        Invite your team
      </h1>
      <p className="text-sm text-text-muted mb-6">
        Add teammates now, or skip this and invite them later from Members.
      </p>

      <form onSubmit={handleInvite} className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[180px]">
          <FormField
            label="Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Dropdown>
          <DropdownTrigger className="inline-flex items-center gap-1.5 px-2.5 h-9 mt-6 rounded-md border border-border text-sm hover:border-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40">
            {ROLE_METADATA[role].label}
            <ChevronDown size={13} className="text-text-subtle" />
          </DropdownTrigger>
          <DropdownContent align="start" className="w-64">
            {ROLE_ORDER.map((r) => (
              <DropdownCheckItem key={r} checked={r === role} onSelect={() => setRole(r)}>
                <span className="flex flex-col items-start">
                  <span className="text-sm font-medium text-text">{ROLE_METADATA[r].label}</span>
                  <span className="text-xs text-text-subtle">{ROLE_METADATA[r].description}</span>
                </span>
              </DropdownCheckItem>
            ))}
          </DropdownContent>
        </Dropdown>
        <Button type="submit" className="mt-6" disabled={sending || !email.trim()}>
          {sending ? "Sending…" : "Add"}
        </Button>
      </form>

      {invited.length > 0 && (
        <ul className="space-y-1.5 mb-6">
          {invited.map((inv) => (
            <li key={inv.email} className="flex items-center gap-2 text-sm">
              <span className="text-text-muted font-mono">{inv.email}</span>
              <Badge variant={ROLE_METADATA[inv.role].badgeVariant}>
                {ROLE_METADATA[inv.role].label}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={onContinue} size="lg" className="flex-1">
          Continue
        </Button>
        {invited.length === 0 && (
          <Button variant="ghost" size="lg" onClick={onContinue}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
