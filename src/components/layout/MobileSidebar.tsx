"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/Sheet";
import { useOrg } from "@/providers/OrgProvider";
import { navigation } from "./navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MobileSidebar() {
  const pathname = usePathname();
  const { currentOrg } = useOrg();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "sm:hidden flex items-center justify-center h-9 w-9 rounded-md text-text-muted",
          "hover:text-text hover:bg-surface-hover transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
        )}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </SheetTrigger>

      <SheetContent side="left">
        <div className="px-4 py-4 border-b border-border">
          <span className="font-semibold tracking-tight text-text">
            TeamDesk
          </span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
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

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  aria-disabled="true"
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-subtle cursor-not-allowed"
                >
                  <Icon size={18} className="shrink-0" />
                  {item.label}
                  <span className="ml-auto text-xs">soon</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-fast",
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:rounded-full before:transition-all before:duration-normal before:ease-standard",
                  active
                    ? "text-primary-subtle-text before:h-4 before:w-[3px] before:bg-primary before:-left-2"
                    : "text-text-muted hover:text-text hover:bg-surface-hover before:h-0 before:w-0",
                )}
              >
                <Icon size={18} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
