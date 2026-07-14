"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?expired=1");
    }
  }, [user, loading, router]);

  if (loading) return <p className="p-8">Loading...</p>;
  if (!user) return null; // avoid flashing protected content during redirect

  return <>{children}</>;
}
