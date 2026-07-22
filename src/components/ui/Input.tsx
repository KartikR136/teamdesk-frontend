import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  /** Left slot — for icons, currency symbols, etc. */
  leftSlot?: React.ReactNode;
  /** Right slot — for icons, clear buttons, etc. */
  rightSlot?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, leftSlot, rightSlot, ...props }, ref) => {
    if (leftSlot || rightSlot) {
      return (
        <div className="relative flex items-center">
          {leftSlot && (
            <span className="absolute left-3 flex items-center text-text-subtle pointer-events-none">
              {leftSlot}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "h-9 w-full rounded-md border bg-surface text-sm text-text",
              "placeholder:text-text-subtle",
              "transition-[border-color,box-shadow] duration-normal ease-standard",
              "focus:outline-none focus:ring-2 focus:border-primary",
              leftSlot ? "pl-9" : "px-3",
              rightSlot ? "pr-9" : "px-3",
              error
                ? "border-danger focus:ring-danger/25"
                : success
                  ? "border-success focus:ring-success/25"
                  : "border-border hover:border-border-hover focus:ring-focus-ring/25",
              className,
            )}
            {...props}
          />
          {rightSlot && (
            <span className="absolute right-3 flex items-center text-text-subtle">
              {rightSlot}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border bg-surface px-3 text-sm text-text",
          "placeholder:text-text-subtle",
          "transition-[border-color,box-shadow] duration-normal ease-standard",
          "focus:outline-none focus:ring-2 focus:border-primary",
          error
            ? "border-danger focus:ring-danger/25"
            : success
              ? "border-success focus:ring-success/25"
              : "border-border hover:border-border-hover focus:ring-focus-ring/25",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border bg-surface px-3 py-2 text-sm text-text",
        "placeholder:text-text-subtle resize-none",
        "transition-[border-color,box-shadow] duration-normal ease-standard",
        "focus:outline-none focus:ring-2 focus:border-primary",
        error
          ? "border-danger focus:ring-danger/25"
          : "border-border hover:border-border-hover focus:ring-focus-ring/25",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
