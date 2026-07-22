"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { Hero } from "@/components/marketing/Hero";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { CollaborationSection } from "@/components/marketing/CollaborationSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.push("/dashboard");
  }, [user, loading, router]);

  // Show a blank screen while auth resolves (same instant flash-free
  // strategy as before — no skeleton needed, resolves in milliseconds).
  if (loading || user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <Hero />
        <FeaturesSection />
        <SecuritySection />
        <CollaborationSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>

      <MarketingFooter />
    </div>
  );
}
