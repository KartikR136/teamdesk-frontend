"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  className,
  children,
  ...props
}: RadixDialog.DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 bg-text/20 backdrop-blur-[2px] z-overlay",
          "data-[state=open]:animate-in data-[state=open]:fade-in",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out",
          "duration-normal ease-standard",
        )}
      />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-dialog",
          "w-full max-w-md rounded-xl border border-border bg-surface shadow-lg p-5",
          "focus:outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          "duration-normal ease-standard",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close
          className={cn(
            "absolute right-4 top-4 rounded-md p-1 text-text-subtle",
            "hover:text-text hover:bg-surface-hover transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
          )}
          aria-label="Close"
        >
          <X size={16} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: RadixDialog.DialogTitleProps) {
  return (
    <RadixDialog.Title
      className={cn("text-lg font-semibold text-text pr-6", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: RadixDialog.DialogDescriptionProps) {
  return (
    <RadixDialog.Description
      className={cn("text-sm text-text-muted mt-1.5", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-end gap-2 mt-5", className)} {...props} />
  );
}
