import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Base card — solid border, elevated surface, smooth shadow on hover. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-xs",
        "transition-[box-shadow,border-color] duration-normal ease-standard",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Interactive card — lifts on hover via CSS transform + shadow upgrade.
 * Use for clickable cards (project cards, decision cards, etc.).
 * Wraps the plain Card so callers can still use it as a div.
 */
export function CardInteractive({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-xs cursor-pointer",
        "transition-all duration-normal ease-standard",
        "hover:border-border-hover hover:shadow-md hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3.5 border-b border-border", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3.5 border-t border-border", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold text-text tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-text-muted leading-relaxed", className)}
      {...props}
    />
  );
}
