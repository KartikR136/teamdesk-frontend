"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/RoleBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import type { Member, PaginatedResponse } from "@/types";

export function WorkspaceOverview({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedResponse<Member>>(
          `/api/organizations/${organizationId}/members`,
        );
        setMembers(res.data);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId]);

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text">Workspace overview</h2>
        <Link
          href="/dashboard/members"
          className="text-xs text-primary hover:text-primary-hover transition-colors"
        >
          Manage →
        </Link>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {members.slice(0, 5).map((m) => (
              <li key={m.userId} className="flex items-center justify-between text-sm">
                <span className="text-text truncate">{m.user.name}</span>
                <RoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
