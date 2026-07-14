"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dropdown = RadixDropdown.Root;
export const DropdownTrigger = RadixDropdown.Trigger;

export function DropdownContent({
  className,
  sideOffset = 6,
  ...props
}: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={sideOffset}
        className={cn(
          "z-dropdown min-w-[10rem] rounded-lg border border-border bg-surface shadow-lg p-1",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          "duration-dropdown ease-standard",
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownItem({
  className,
  ...props
}: RadixDropdown.DropdownMenuItemProps) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm text-text",
        "cursor-pointer select-none outline-none",
        "hover:bg-surface-hover focus:bg-surface-hover",
        "transition-colors duration-fast",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownCheckItem({
  className,
  checked,
  children,
  ...props
}: RadixDropdown.DropdownMenuCheckboxItemProps) {
  return (
    <RadixDropdown.CheckboxItem
      checked={checked}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm text-text",
        "cursor-pointer select-none outline-none",
        "hover:bg-surface-hover focus:bg-surface-hover",
        "transition-colors duration-fast",
        className,
      )}
      {...props}
    >
      {children}
      {checked && <Check size={14} className="text-primary" />}
    </RadixDropdown.CheckboxItem>
  );
}

export function DropdownSeparator({
  className,
}: {
  className?: string;
}) {
  return (
    <RadixDropdown.Separator
      className={cn("my-1 h-px bg-border", className)}
    />
  );
}
