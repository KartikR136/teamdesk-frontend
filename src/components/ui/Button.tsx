"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-medium tracking-tight",
    "transition-colors duration-fast ease-standard",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:opacity-50 disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md",
        secondary:
          "bg-surface text-text border border-border hover:border-border-hover hover:bg-surface-hover shadow-xs",
        ghost:
          "text-text-muted hover:text-text hover:bg-surface-hover",
        danger:
          "bg-danger text-white hover:bg-danger-hover shadow-sm",
        outline:
          "border border-primary/30 text-primary hover:bg-primary-subtle hover:border-primary/50",
        link:
          "text-primary hover:text-primary-hover underline-offset-2 hover:underline p-0 h-auto shadow-none",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-9 px-3.5 text-sm rounded-lg",
        lg: "h-10 px-4 text-base rounded-lg",
        xl: "h-12 px-6 text-base rounded-xl",
        icon: "h-9 w-9 rounded-lg p-0",
        "icon-sm": "h-7 w-7 rounded-md p-0",
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
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        whileTap={
          shouldReduceMotion
            ? {}
            : { scale: variant === "link" ? 1 : 0.97 }
        }
        transition={{ duration: 0.08, ease: "easeOut" }}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin shrink-0" />
            {children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="shrink-0">{rightIcon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
