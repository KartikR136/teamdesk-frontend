"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { navigation } from "./navigation";
import { useOrg } from "@/providers/OrgProvider";
import { OrgContextPanel } from "./OrgContextPanel";
import { Tooltip } from "@/components/ui/Tooltip";
import { KBD } from "@/components/ui/KBD";
import { useCommandPalette } from "@/components/ui/CommandPalette";

const STORAGE_KEY = "sidebarCollapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { currentOrg } = useOrg();
  const { openPalette } = useCommandPalette();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.aside
      className="hidden sm:flex flex-col shrink-0 border-r border-border bg-surface overflow-hidden"
      animate={{ width: collapsed ? 56 : 224 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Org context */}
      <OrgContextPanel collapsed={collapsed} />

      {/* Command palette shortcut */}
      <div className="px-2 pb-1">
        <Tooltip content={<span className="flex items-center gap-1.5">Search <KBD>⌘K</KBD></span>} side="right">
          <button
            onClick={openPalette}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-md px-2.5 py-2",
              "text-xs text-text-subtle hover:text-text hover:bg-surface-hover",
              "transition-colors duration-fast",
              collapsed && "justify-center px-0",
            )}
            aria-label="Open command palette"
          >
            <Command size={15} className="shrink-0" />
            {!collapsed && (
              <span className="flex items-center justify-between flex-1 min-w-0">
                <span>Search…</span>
                <KBD>⌘K</KBD>
              </span>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5" aria-label="Main navigation">
        {navigation.map((item) => {
          if (item.roles && currentOrg && !item.roles.includes(currentOrg.role)) {
            return null;
          }

          const active = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          const inner = (
            <span
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium",
                "transition-all duration-fast",
                collapsed && "justify-center px-2",
                item.comingSoon
                  ? "text-text-subtle cursor-not-allowed opacity-60"
                  : active
                    ? "bg-primary-subtle text-primary shadow-xs"
                    : "text-text-muted hover:text-text hover:bg-surface-hover",
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-primary -ml-2" />
              )}
              <Icon size={16} className="shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    className="truncate flex-1"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                    {item.comingSoon && (
                      <span className="ml-1.5 text-[10px] font-normal text-text-subtle">soon</span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          );

          if (item.comingSoon) {
            return (
              <Tooltip key={item.href} content={`${item.label} — coming soon`} side="right">
                <div aria-disabled="true">{inner}</div>
              </Tooltip>
            );
          }

          return collapsed ? (
            <Tooltip key={item.href} content={item.label} side="right">
              <Link href={item.href}>{inner}</Link>
            </Tooltip>
          ) : (
            <Link key={item.href} href={item.href}>{inner}</Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-3">
        <Tooltip content={collapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"} side="right">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "flex items-center gap-2 w-full px-2.5 py-2 rounded-lg",
              "text-xs text-text-subtle hover:text-text hover:bg-surface-hover",
              "transition-colors duration-fast",
              collapsed && "justify-center",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={15}
              className={cn("transition-transform duration-normal shrink-0", collapsed && "rotate-180")}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
