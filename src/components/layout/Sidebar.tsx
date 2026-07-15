"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation } from "./navigation";
import { useOrg } from "@/providers/OrgProvider";
import { OrgContextPanel } from "./OrgContextPanel";

const STORAGE_KEY = "sidebarCollapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { currentOrg } = useOrg();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted collapse state on mount. Guarded by `hydrated` so
  // the very first client render matches the server render (avoids a
  // hydration mismatch warning) before flipping to the stored value.
  useEffect(() => {
    void (async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  // Ctrl+B (or Cmd+B on Mac) toggles collapse — same shortcut VS Code uses
  // for its sidebar, chosen deliberately for that familiarity.
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
    <aside
      className={cn(
        "hidden sm:flex flex-col shrink-0 border-r border-border bg-surface",
        "transition-[width] duration-normal ease-standard",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <OrgContextPanel collapsed={collapsed} />
        {navigation.map((item) => {
          if (
            item.roles &&
            currentOrg &&
            !item.roles.includes(currentOrg.role)
          ) {
            return null;
          }

          const active = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <span
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-fast",
                collapsed && "justify-center px-0",
                item.comingSoon
                  ? "text-text-subtle cursor-not-allowed"
                  : active
                    ? "bg-primary-subtle text-primary-subtle-text"
                    : "text-text-muted hover:text-text hover:bg-surface-hover",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="truncate">
                  {item.label}
                  {item.comingSoon && (
                    <span className="ml-1.5 text-xs text-text-subtle">
                      soon
                    </span>
                  )}
                </span>
              )}
            </span>
          );

          if (item.comingSoon) {
            return (
              <div key={item.href} aria-disabled="true">
                {content}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-2.5 py-3 mx-2 mb-2 rounded-md text-xs text-text-subtle",
          "hover:text-text hover:bg-surface-hover transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={16}
          className={cn(
            "transition-transform duration-normal",
            collapsed && "rotate-180",
          )}
        />
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
