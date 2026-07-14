"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { MobileSidebar } from "./MobileSidebar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/Dropdown";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

// Breadcrumbs are derived automatically from the pathname rather than
// passed as props from every page — this was a named requirement:
// /dashboard/projects should become "Dashboard > Projects" without any
// page having to construct that array itself. Route segments are
// capitalized directly; if a segment needs a custom label (e.g. showing
// a project's real name instead of its id) that mapping can be added
// here later without touching any page.
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

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-sticky">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <MobileSidebar />

          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
            {crumbs.map((crumb) => (
              <Fragment key={crumb.href}>
                {crumb.href !== crumbs[0].href && (
                  <ChevronRight size={14} className="text-text-subtle shrink-0" />
                )}
                {crumb.isLast ? (
                  <span className="font-medium text-text truncate">{crumb.label}</span>
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Search stub — intentionally not a full implementation.
              Becomes a command palette (⌘K) once there's enough content
              across the app to warrant one; premature to build now. */}
          <button
            className={cn(
              "hidden md:flex items-center gap-2 h-8 px-3 rounded-md text-sm text-text-subtle",
              "border border-border hover:border-border-hover transition-colors duration-fast",
            )}
          >
            <Search size={14} />
            <span>Search</span>
            <kbd className="ml-2 text-xs bg-surface-hover px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </button>

          <OrgSwitcher />

          {/* Notifications placeholder — no backend endpoint exists for
              this yet, so the icon renders with no unread indicator and
              no dropdown content. Reserves the UI slot per the nav spec
              without inventing a feature the backend doesn't support. */}
          <button
            className="h-8 w-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-fast"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>

          <Dropdown>
            <DropdownTrigger className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40">
              <Avatar name={user?.name ?? "?"} size="md" />
            </DropdownTrigger>
            <DropdownContent align="end">
              <div className="px-2.5 py-1.5 text-sm text-text-muted truncate">
                {user?.email}
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
