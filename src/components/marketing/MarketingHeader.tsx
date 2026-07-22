"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
];

/** TeamDesk wordmark — geometric "T" built from SVG paths */
function LogoMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      {/* Abstract mark: two stacked bars forming a "T" with a clay accent */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="7" fill="var(--primary)" />
        {/* Horizontal bar */}
        <rect x="5" y="8" width="18" height="3.5" rx="1.75" fill="white" />
        {/* Vertical stem */}
        <rect x="11.25" y="8" width="5.5" height="13" rx="2" fill="white" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight text-text group-hover:text-primary transition-colors duration-fast">
        TeamDesk
      </span>
    </Link>
  );
}

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <motion.header
        className={cn(
          "sticky top-0 z-sticky",
          "transition-[background,border-color,box-shadow] duration-normal ease-standard",
          scrolled
            ? "bg-surface/90 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent border-b border-transparent",
        )}
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <LogoMark />

          {/* Desktop nav */}
          <nav
            className="hidden sm:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm text-text-muted font-medium",
                  "hover:text-text hover:bg-surface-hover",
                  "transition-colors duration-fast",
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                Get started
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <button
              className={cn(
                "sm:hidden h-8 w-8 flex items-center justify-center rounded-md",
                "text-text-muted hover:text-text hover:bg-surface-hover",
                "transition-colors duration-fast",
              )}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sm:hidden fixed inset-x-0 top-16 z-sticky bg-surface border-b border-border shadow-lg"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <nav className="flex flex-col px-5 py-4 gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">
                    Get started free
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
