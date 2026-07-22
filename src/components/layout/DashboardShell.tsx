import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPaletteProvider } from "@/components/ui/CommandPalette";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      {/* WCAG 2.4.1 (Bypass Blocks): first focusable element on every
          authenticated page. Visually hidden until it receives keyboard
          focus (sr-only + focus-visible overrides), so mouse users never
          see it but Tab from the top of the page reveals it immediately. */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-dialog focus-visible:rounded-md focus-visible:bg-surface focus-visible:border focus-visible:border-border focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-text focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40"
      >
        Skip to main content
      </a>

      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          {/* tabIndex={-1}: an href="#main-content" alone scrolls the
              viewport but does NOT move keyboard focus unless the target
              is itself focusable. -1 makes it a valid focus target via
              script/anchor without adding it to the normal Tab order. */}
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
