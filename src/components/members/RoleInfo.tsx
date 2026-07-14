import type { Role } from "@/types";
import { ROLE_METADATA } from "@/lib/roles";

export function RoleInfo({ role }: { role: Role }) {
  const meta = ROLE_METADATA[role];
  return (
    <div>
      <p className="text-sm font-medium text-text">{meta.label}</p>
      <p className="text-xs text-text-subtle mt-0.5">{meta.description}</p>
    </div>
  );
}
