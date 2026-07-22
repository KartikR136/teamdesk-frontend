"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  delayDuration = 400,
  className,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              "z-tooltip px-2.5 py-1.5 rounded-lg",
              "bg-stone-900 text-white text-xs font-medium shadow-lg",
              "dark:bg-stone-100 dark:text-stone-900",
              "max-w-xs leading-snug",
              "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out",
              "data-[side=top]:slide-in-from-bottom-1",
              "data-[side=bottom]:slide-in-from-top-1",
              "data-[side=left]:slide-in-from-right-1",
              "data-[side=right]:slide-in-from-left-1",
              "duration-fast",
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-stone-900 dark:fill-stone-100" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
