import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Keyboard shortcut display. Renders as a styled <kbd> element.
 *
 * Usage:
 *   <KBD>⌘K</KBD>
 *   <KBD>Ctrl</KBD><span>+</span><KBD>B</KBD>
 */
export function KBD({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[1.375rem] h-5 px-1.5",
        "rounded border border-border bg-surface-hover",
        "text-[10px] font-medium text-text-subtle font-sans",
        "shadow-[0_1px_0_0_var(--border)]",
        className,
      )}
      {...props}
    />
  );
}
