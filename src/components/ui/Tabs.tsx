"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;

export function TabsList({
  className,
  ...props
}: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-surface-hover p-1 border border-border",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-3 py-1.5",
        "text-sm font-medium rounded-md",
        "text-text-muted transition-all duration-fast",
        "hover:text-text hover:bg-surface",
        "data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: RadixTabs.TabsContentProps) {
  return (
    <RadixTabs.Content
      className={cn(
        "focus-visible:outline-none",
        "data-[state=active]:animate-in data-[state=active]:fade-in",
        "duration-normal",
        className,
      )}
      {...props}
    />
  );
}

/** Underline variant — for page-level tabs */
export function TabsListUnderline({
  className,
  ...props
}: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        "flex items-center gap-1 border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTriggerUnderline({
  className,
  ...props
}: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "relative inline-flex items-center gap-1.5 px-1 pb-3 pt-1",
        "text-sm font-medium text-text-muted",
        "transition-colors duration-fast hover:text-text",
        "border-b-2 border-transparent -mb-px",
        "data-[state=active]:text-text data-[state=active]:border-primary",
        "focus-visible:outline-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
