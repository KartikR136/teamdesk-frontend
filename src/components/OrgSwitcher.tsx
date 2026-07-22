"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { apiFetch } from "@/lib/api";
import { useNotify } from "@/lib/notifications";
import { RoleBadge } from "@/components/RoleBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import type { Organization } from "@/types";

export function OrgSwitcher() {
  const { orgs, currentOrg, setCurrentOrgId, refetchOrgs } = useOrg();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    try {
      const org = await apiFetch<Organization>("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });
      await refetchOrgs();
      setCurrentOrgId(org.id);
      setName("");
      setCreating(false);
      setOpen(false);
      notify.success("Organization created", `Switched to ${org.name}.`);
    } catch {
      notify.error(
        "Could not create organization",
        "That name may already be taken.",
      );
    }
  }

  return (
    <Dropdown
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCreating(false);
      }}
    >
      <DropdownTrigger asChild>
        <button
          className="flex items-center gap-2 px-2.5 h-9 rounded-lg border border-border bg-surface hover:border-border-hover hover:shadow-sm transition-all duration-fast"
          aria-label={`Switch organization, current: ${currentOrg?.name ?? "none selected"}`}
        >
          <Avatar name={currentOrg?.name ?? "?"} size="sm" />
          <span className="text-sm font-medium text-text hidden md:inline">
            {currentOrg?.name ?? "Select organization"}
          </span>
          {currentOrg && <RoleBadge role={currentOrg.role} />}
          <ChevronDown size={14} className="text-text-subtle" />
        </button>
      </DropdownTrigger>

      <DropdownContent
        align="start"
        className="w-72"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-72 overflow-y-auto">
          {orgs.map((org) => (
            <DropdownItem
              key={org.id}
              onSelect={() => setCurrentOrgId(org.id)}
              className={
                org.id === currentOrg?.id ? "bg-primary-subtle/40" : ""
              }
            >
              <span className="flex items-center gap-2 text-text">
                <Avatar name={org.name} size="sm" tone="subtle" />
                {org.name}
              </span>
              <RoleBadge role={org.role} />
            </DropdownItem>
          ))}
          {orgs.length === 0 && (
            <div className="px-2.5 py-2 text-sm text-text-subtle">
              No organizations yet
            </div>
          )}
        </div>

        <DropdownSeparator />

        {!creating ? (
          <DropdownItem
            onSelect={(e) => {
              e.preventDefault();
              setCreating(true);
            }}
            className="text-primary font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Plus size={14} /> New organization
            </span>
          </DropdownItem>
        ) : (
          <form
            onSubmit={handleCreate}
            className="flex gap-1.5 px-2 py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="h-8 text-sm"
              required
            />
            <Button type="submit" size="sm">
              Create
            </Button>
          </form>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
