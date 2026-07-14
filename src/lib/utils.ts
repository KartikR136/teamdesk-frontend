import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines conditional classnames (clsx) with conflict resolution
// (tailwind-merge) — e.g. cn("px-2", condition && "px-4") correctly
// resolves to just "px-4" instead of emitting both classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
