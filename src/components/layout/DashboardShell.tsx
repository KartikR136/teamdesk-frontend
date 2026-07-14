import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// Deliberately layout-only: no data fetching, no auth checks (that's
// ProtectedRoute's job, applied by each page same as before), no
// business logic of any kind. Composition only:
//   DashboardShell
//   ├── Sidebar
//   ├── Header (renders breadcrumbs internally — see Header.tsx)
//   └── Main
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
