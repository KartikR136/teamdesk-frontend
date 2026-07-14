"use client";

import * as RadixAvatar from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold shrink-0 select-none",
  {
    variants: {
      size: {
        sm: "h-5 w-5 text-[10px]",
        md: "h-6 w-6 text-xs",
        lg: "h-8 w-8 text-sm",
      },
      tone: {
        solid: "bg-primary text-white",
        subtle: "bg-surface-hover text-text-muted",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "solid",
    },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  className?: string;
}

// Text-only avatar (initials) — no image upload support in the product
// yet, so this deliberately doesn't wire up RadixAvatar.Image. Adding
// photo avatars later just means adding an AvatarImage usage here without
// touching any call site.
export function Avatar({ name, size, tone, className }: AvatarProps) {
  return (
    <RadixAvatar.Root className={cn(avatarVariants({ size, tone }), className)}>
      <RadixAvatar.Fallback>{name[0]?.toUpperCase() ?? "?"}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
