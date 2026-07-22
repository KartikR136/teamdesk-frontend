"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { MobileSidebar } from "./MobileSidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Tooltip } from "@/components/ui/Tooltip";
import { KBD } from "@/components/ui/KBD";
import { useCommandPalette } from "@/components/ui/CommandPalette";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { href, label, isLast: i === segments.length - 1 };
  });
}

export function Header() {
  const { user, logout } = useAuth();
  const crumbs = useBreadcrumbs();
  const { openPalette } = useCommandPalette();

  return (
    <header className="h-14 border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-sticky">
      <div className="h-full px-4 sm:px-5 flex items-center justify-between gap-4">
        {/* Left — mobile toggle + breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <MobileSidebar />

          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1.5 text-sm min-w-0"
          >
            {crumbs.map((crumb) => (
              <Fragment key={crumb.href}>
                {crumb.href !== crumbs[0].href && (
                  <ChevronRight
                    size={12}
                    className="text-text-subtle/50 shrink-0"
                    strokeWidth={2.5}
                  />
                )}
                {crumb.isLast ? (
                  <span className="font-semibold text-text truncate tracking-tight">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-text-muted hover:text-text transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </Fragment>
            ))}
          </nav>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Command palette button */}
          <Tooltip content={<span className="flex items-center gap-1.5">Search <KBD>⌘K</KBD></span>}>
            <button
              onClick={openPalette}
              className={cn(
                "hidden md:flex items-center gap-2 h-8 px-2.5 rounded-md",
                "text-sm text-text-subtle bg-surface-hover/60",
                "border border-transparent hover:border-border hover:bg-surface",
                "transition-all duration-fast",
              )}
              aria-label="Open search (⌘K)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Search</span>
              <KBD>⌘K</KBD>
            </button>
          </Tooltip>

          <ThemeToggle />

          <OrgSwitcher />

          {/* Notifications placeholder */}
          <Tooltip content="Notifications — coming soon">
            <button
              className="h-8 w-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-fast"
              aria-label="Notifications (coming soon)"
            >
              <Bell size={16} />
            </button>
          </Tooltip>

          <Dropdown>
            <DropdownTrigger
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40"
              aria-label={user?.name ? `Account menu for ${user.name}` : "Account menu"}
            >
              <Avatar name={user?.name ?? "?"} size="md" />
            </DropdownTrigger>
            <DropdownContent align="end" className="w-52">
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-text truncate">{user?.name}</p>
                <p className="text-xs text-text-muted truncate mt-0.5">{user?.email}</p>
              </div>
              <DropdownSeparator />
              <DropdownItem onSelect={logout}>Log out</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
