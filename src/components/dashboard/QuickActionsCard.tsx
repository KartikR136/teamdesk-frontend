"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  FolderPlus,
  ScrollText,
  UserPlus,
  Search,
  Rows3,
} from "lucide-react";
import { Zap } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";

interface QuickActionDef {
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  href?: string; // absent = comingSoon, matching Sidebar's convention
}

// Only "Decision Log" and "Invite Member" have real destinations today.
// The rest need infrastructure this milestone doesn't build (a project
// picker for Create Issue, the actual create-project dialog lifted out
// of ProjectsSection, a command palette for Search, and a Sprint
// feature that doesn't exist yet) — so they render disabled with a
// "Soon" tag, exactly like Sidebar.tsx's comingSoon nav items, rather
// than linking to nowhere.
const ACTIONS: QuickActionDef[] = [
  { label: "Create Issue", shortcut: "C I", icon: <Plus size={16} /> },
  { label: "Create Project", shortcut: "C P", icon: <FolderPlus size={16} /> },
  {
    label: "Decision Log",
    shortcut: "G D",
    icon: <ScrollText size={16} />,
    href: "/dashboard/decisions/new",
  },
  {
    label: "Invite Member",
    shortcut: "G M",
    icon: <UserPlus size={16} />,
    href: "/dashboard/members",
  },
  { label: "Search Issues", shortcut: "⌘K", icon: <Search size={16} /> },
  { label: "Create Sprint", shortcut: "C S", icon: <Rows3 size={16} /> },
];

function ActionTile({
  action,
  index,
}: {
  action: QuickActionDef;
  index: number;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-lg border border-border p-3 h-full",
        action.href
          ? "hover:border-border-hover hover:shadow-sm hover:-translate-y-0.5 transition-all duration-normal cursor-pointer"
          : "opacity-60 cursor-not-allowed",
      )}
    >
      <span className="text-text-muted">{action.icon}</span>
      <span className="text-sm font-medium text-text">{action.label}</span>

      {action.href ? (
        <kbd className="absolute top-2.5 right-2.5 text-[10px] font-medium text-text-subtle bg-surface-hover px-1.5 py-0.5 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity">
          {action.shortcut}
        </kbd>
      ) : (
        <span className="absolute top-2.5 right-2.5 text-[10px] font-medium text-text-subtle uppercase tracking-wide">
          Soon
        </span>
      )}
    </motion.div>
  );

  if (!action.href) return content;
  return <Link href={action.href}>{content}</Link>;
}

export function QuickActionsCard() {
  // No loading/empty/error states needed — this is static, local
  // configuration, not fetched data (unlike every other widget here).
  return (
    <WidgetCard
      title="Quick Actions"
      icon={<Zap size={15} />}
      status="ready"
      skeleton={null}
      emptyState={null}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action, i) => (
          <ActionTile key={action.label} action={action} index={i} />
        ))}
      </div>
    </WidgetCard>
  );
}
