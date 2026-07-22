"use client";

import * as RadixProgress from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;         // 0–100
  max?: number;
  className?: string;
  trackClassName?: string;
  size?: "xs" | "sm" | "md";
  variant?: "default" | "success" | "warning" | "danger";
  animated?: boolean;
  label?: string;
}

const SIZE_CLASS = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

const VARIANT_CLASS = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger:  "bg-danger",
};

export function Progress({
  value,
  max = 100,
  className,
  trackClassName,
  size = "sm",
  variant = "default",
  animated = true,
  label,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <RadixProgress.Root
      value={value}
      max={max}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-pill bg-surface-hover", SIZE_CLASS[size], trackClassName)}
    >
      <motion.div
        className={cn("h-full rounded-pill origin-left", VARIANT_CLASS[variant], className)}
        initial={animated ? { scaleX: 0 } : { scaleX: pct / 100 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        style={{ transformOrigin: "left center" }}
      />
    </RadixProgress.Root>
  );
}
