import type { DecisionStatus } from "@/types";

export interface DecisionStatusMeta {
  label: string;
  description: string;
  /** Tailwind classes, following the exact same "semantic tokens only"
   * rule as IssueStatus.tsx's STATUS_STYLES — no raw color utilities. */
  className: string;
}

// Mirrors lib/roles.ts's ROLE_METADATA pattern: a single source of truth
// for label/description/styling per enum value, so no component has to
// re-derive a human-readable label or re-invent the status color mapping.
export const DECISION_STATUS_METADATA: Record<DecisionStatus, DecisionStatusMeta> = {
  DRAFT: {
    label: "Draft",
    description: "Still being written or discussed — not yet a final decision.",
    className: "bg-surface-hover text-text-muted",
  },
  ACCEPTED: {
    label: "Accepted",
    description: "The decision the team is currently operating on.",
    className: "bg-success-subtle text-success",
  },
  SUPERSEDED: {
    label: "Superseded",
    description: "Replaced by a newer decision — kept for historical context.",
    className: "bg-warning-subtle text-warning",
  },
  ARCHIVED: {
    label: "Archived",
    description: "No longer relevant, but preserved for the record.",
    className: "bg-surface-hover text-text-subtle",
  },
};

export const DECISION_STATUS_ORDER: DecisionStatus[] = [
  "DRAFT",
  "ACCEPTED",
  "SUPERSEDED",
  "ARCHIVED",
];
