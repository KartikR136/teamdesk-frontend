import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  /** Round to full pill shape — useful for avatar placeholders */
  round?: boolean;
}

/**
 * Shimmer skeleton — uses a CSS gradient sweep animation rather than
 * a flat pulse so loading states look alive and intentional.
 */
export function Skeleton({ className, round }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer",
        round ? "rounded-full" : "rounded-md",
        className,
      )}
      aria-hidden="true"
    />
  );
}

/** A block of text placeholder lines at varying widths */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ["w-full", "w-4/5", "w-3/4", "w-2/3", "w-1/2"];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}
