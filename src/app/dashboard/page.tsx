"use client";

import Link from "next/link";
import { Building2, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useOrg } from "@/providers/OrgProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DeveloperHero } from "@/components/dashboard/DeveloperHero";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { currentOrg, loading: orgLoading } = useOrg();
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Loading org — unchanged from the previous dashboard, since
              org switching/loading behavior must keep working exactly
              as it did before this redesign. */}
          {orgLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-8 w-56 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-9 w-64 rounded-md" />
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            </div>
          )}

          {/* No org — unchanged from the previous dashboard */}
          {!orgLoading && !currentOrg && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto text-center py-20"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary-subtle flex items-center justify-center mx-auto mb-5">
                <Building2 size={24} className="text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-text mb-2">
                No organization yet
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                An organization is where your team&apos;s projects, issues, and
                decisions live. Create one to get started, or ask a teammate to
                invite you.
              </p>
              <Link href="/onboarding">
                <Button leftIcon={<Rocket size={15} />}>
                  Set up your workspace
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Developer Command Center */}
          {currentOrg && (
            <div className="space-y-8">
              <DeveloperHero name={user?.name} />
              <AISummaryCard />
              <DashboardGrid />
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
