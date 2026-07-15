import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Mail,
  Activity,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, item is only shown when currentOrg.role is one of these. */
  roles?: Role[];
  /** Reserved for future use (e.g. pending-invite count) — not wired to
   * live data yet, no page currently exposes a count to show here. */
  badge?: number;
  /** Route doesn't exist yet — render disabled instead of linking to a
   * 404. Reserves the nav slot (so Sidebar.tsx won't need structural
   * changes when the page ships) without creating a dead end. */
  comingSoon?: boolean;
}

// Single source of truth for sidebar navigation. Adding a page, an icon,
// a role restriction, or a badge count later means editing this array —
// Sidebar.tsx and MobileSidebar.tsx just map over it, no rewrite needed.
export const navigation: NavItem[] = [
  { label: "Projects", href: "/dashboard", icon: LayoutDashboard },
  { label: "Members", href: "/dashboard/members", icon: Users },
  { label: "My invites", href: "/dashboard/invitations", icon: Mail },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  // Only exists in demo deployments — mirrors the backend's DEMO_MODE gate.
  // Not a role restriction (no `roles` field): this hides the feature
  // entirely rather than showing it as disabled, since it isn't a "coming
  // soon" real feature — it's a demo-only artifact.
  ...(process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    ? [{ label: "Security", href: "/dashboard/security", icon: ShieldCheck }]
    : []),
  // Settings remains a real, named future milestone — not invented scope.
  // Reserving its slot now, disabled, avoids a Sidebar rewrite later
  // without linking anywhere that 404s today.
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    comingSoon: true,
  },
];
