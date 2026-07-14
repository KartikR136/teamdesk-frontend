"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Built on the same Radix Dialog primitive as components/ui/Dialog.tsx —
// a Sheet is a Dialog with different positioning and animation, not a
// separate accessibility implementation. This mirrors how shadcn/ui
// derives Sheet from Dialog rather than hand-rolling a second focus-trap.

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

type Side = "left" | "right";

const SIDE_STYLES: Record<Side, string> = {
  left: "left-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right:
    "right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
};

export function SheetContent({
  side = "left",
  className,
  children,
  ...props
}: RadixDialog.DialogContentProps & { side?: Side }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 bg-text/20 backdrop-blur-[2px] z-overlay",
          "data-[state=open]:animate-in data-[state=open]:fade-in",
          "duration-drawer ease-standard",
        )}
      />
      <RadixDialog.Content
        className={cn(
          "fixed top-0 bottom-0 z-dialog w-72 max-w-[85vw]",
          "bg-surface border-border shadow-lg p-4",
          side === "left" ? "border-r" : "border-l",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "duration-drawer ease-standard",
          "focus:outline-none",
          SIDE_STYLES[side],
          className,
        )}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function SheetTitle({
  className,
  ...props
}: RadixDialog.DialogTitleProps) {
  return (
    <RadixDialog.Title
      className={cn("text-sm font-semibold text-text", className)}
      {...props}
    />
  );
}
