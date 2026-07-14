import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
    "duration-normal ease-standard",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        secondary:
          "bg-surface text-text border border-border hover:border-border-hover hover:bg-surface-hover",
        ghost: "text-text-muted hover:text-text hover:bg-surface-hover",
        danger: "bg-danger text-white hover:bg-danger-hover",
        link: "text-primary hover:text-primary-hover underline-offset-2 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-9 px-3.5 text-sm rounded-lg",
        lg: "h-10 px-4 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
