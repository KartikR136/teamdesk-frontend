"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "danger";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Semantic per-variant left-border accent, kept token-based so a rebrand
// only ever touches theme.css.
const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-l-4 border-l-border",
  success: "border-l-4 border-l-success",
  danger: "border-l-4 border-l-danger",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            duration={5000}
            onOpenChange={(open) => !open && dismiss(t.id)}
            className={cn(
              "rounded-lg bg-surface shadow-lg p-4 pr-10 relative",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out",
              "duration-normal ease-standard",
              VARIANT_STYLES[t.variant],
            )}
          >
            <RadixToast.Title className="text-sm font-medium text-text">
              {t.title}
            </RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-sm text-text-muted mt-0.5">
                {t.description}
              </RadixToast.Description>
            )}
            <RadixToast.Close
              className="absolute right-3 top-3 text-text-subtle hover:text-text transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 w-full max-w-sm outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
