"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/RoleBadge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownCheckItem,
} from "@/components/ui/Dropdown";
import { ROLE_METADATA, ROLE_ORDER } from "@/lib/roles";
import type { Invitation, Role } from "@/types";
import { ChevronDown } from "lucide-react";

export function InviteCard({
  invitations,
  onInvite,
}: {
  invitations: Invitation[];
  onInvite: (email: string, role: Role) => Promise<boolean>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const success = await onInvite(email, role);
      if (success) {
        setEmail("");
        setRole("MEMBER");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-medium text-text mb-3">Invite a member</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          className="flex-1 min-w-[200px] font-mono"
          required
        />
        <Dropdown>
          <DropdownTrigger className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-md border border-border text-sm hover:border-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40">
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
        <Button type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send invite"}
        </Button>
      </form>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2">
          Pending invitations
        </p>

        {invitations.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-text-subtle py-2">
            <Mail size={14} />
            No pending invitations. Invite your first teammate above.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  Sent to <span className="font-mono text-text">{inv.email}</span>
                </span>
                <div className="flex items-center gap-2">
                  <RoleBadge role={inv.role} />
                  <span className="text-xs text-text-subtle">
                    expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
