"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOrg } from "@/providers/OrgProvider";
import { SearchBar } from "./SearchBar";

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// A short rotating set so the hero doesn't say the exact same line every
// single day — picked deterministically by day-of-year so it's stable
// within a session/day rather than flickering on every render.
const MOTIVATIONAL_LINES = [
  "Ready to ship something amazing today?",
  "Let's clear the board today.",
  "Momentum compounds — let's keep it going.",
  "Focus mode: on.",
];

function motivationalLine(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return MOTIVATIONAL_LINES[dayOfYear % MOTIVATIONAL_LINES.length];
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function DeveloperHero({ name }: { name: string | undefined }) {
  const firstName = name?.split(" ")[0] ?? "";
  const { currentOrg } = useOrg();
  const canCreate =
    currentOrg && ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
    >
      <div>
        <motion.p
          variants={item}
          className="text-xs font-semibold uppercase tracking-widest text-primary mb-1"
        >
          {formatDate()}
        </motion.p>
        <motion.h1
          variants={item}
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-text mb-1"
        >
          {timeOfDay()}
          {firstName && `, ${firstName}`}
        </motion.h1>
        <motion.p variants={item} className="text-sm text-text-muted">
          {currentOrg?.name ?? "Your workspace"} · {motivationalLine()}
        </motion.p>
      </div>

      {/* Command bar entry point */}
      <motion.div variants={item} className="flex items-center gap-2">
        <SearchBar />
        {canCreate && (
          <Link href="/dashboard/decisions/new">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ScrollText size={14} />}
            >
              Log decision
            </Button>
          </Link>
        )}
      </motion.div>
    </motion.div>
  );
}
