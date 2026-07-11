"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { OrgSwitcher } from "@/components/OrgSwitcher";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects" },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/invitations", label: "My invites" },
];

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-tight text-zinc-900">
            TeamDesk
          </span>
          <OrgSwitcher />
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 hidden md:inline">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
