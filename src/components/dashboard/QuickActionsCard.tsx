"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { useQuickActions } from "@/components/quickActions/QuickActionsProvider";
import { useCommandPalette } from "@/components/ui/CommandPalette";
import { cn } from "@/lib/utils";

interface QuickActionDef {
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ActionTile({ action, index }: { action: QuickActionDef; index: number }) {
  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-lg border border-border p-3 h-full text-left",
        "hover:border-border-hover hover:shadow-sm hover:-translate-y-0.5 transition-all duration-normal cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
      )}
    >
      <span className="text-text-muted">{action.icon}</span>
      <span className="text-sm font-medium text-text">{action.label}</span>
      <kbd className="absolute top-2.5 right-2.5 text-[10px] font-medium text-text-subtle bg-surface-hover px-1.5 py-0.5 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity">
        {action.shortcut}
      </kbd>
    </motion.button>
  );
}

export function QuickActionsCard() {
  const router = useRouter();
  const { openCreateIssue, openCreateProject, openCreateSprint } = useQuickActions();
  const { openPalette } = useCommandPalette();

  // Every tile now has a real destination — either a dialog wired to a
  // live endpoint (Create Issue/Project/Sprint), a page that already
  // exists (Decision Log, Invite Member), or the command palette
  // (Search Issues), matching the shortcuts shown on hover exactly (see
  // useGlobalShortcuts.ts, which fires the same handlers app-wide).
  const actions: QuickActionDef[] = [
    { label: "Create Issue", shortcut: "C I", icon: <Plus size={16} />, onClick: () => openCreateIssue() },
    { label: "Create Project", shortcut: "C P", icon: <FolderPlus size={16} />, onClick: openCreateProject },
    {
      label: "Decision Log",
      shortcut: "G D",
      icon: <ScrollText size={16} />,
      onClick: () => router.push("/dashboard/decisions/new"),
    },
    {
      label: "Invite Member",
      shortcut: "G M",
      icon: <UserPlus size={16} />,
      onClick: () => router.push("/dashboard/members"),
    },
    { label: "Search Issues", shortcut: "⌘K", icon: <Search size={16} />, onClick: openPalette },
    { label: "Create Sprint", shortcut: "C S", icon: <Rows3 size={16} />, onClick: () => openCreateSprint() },
  ];

  return (
    <WidgetCard
      title="Quick Actions"
      icon={<Zap size={15} />}
      status="ready"
      skeleton={null}
      emptyState={null}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action, i) => (
          <ActionTile key={action.label} action={action} index={i} />
        ))}
      </div>
    </WidgetCard>
  );
}
