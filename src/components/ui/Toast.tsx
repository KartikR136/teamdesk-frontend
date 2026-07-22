"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "danger" | "info";

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

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; accent: string; bg: string }
> = {
  default: {
    icon: <Info size={15} className="text-text-muted" />,
    accent: "border-l-border",
    bg: "bg-surface",
  },
  success: {
    icon: <CheckCircle2 size={15} className="text-success" />,
    accent: "border-l-success",
    bg: "bg-surface",
  },
  danger: {
    icon: <XCircle size={15} className="text-danger" />,
    accent: "border-l-danger",
    bg: "bg-surface",
  },
  info: {
    icon: <Info size={15} className="text-info" />,
    accent: "border-l-info",
    bg: "bg-surface",
  },
};

function ToastItem({ t, onDismiss }: { t: ToastItem; onDismiss: () => void }) {
  const config = VARIANT_CONFIG[t.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <RadixToast.Root
        duration={5000}
        onOpenChange={(open) => !open && onDismiss()}
        className={cn(
          "group relative flex items-start gap-3",
          "rounded-xl border border-border shadow-lg",
          "px-4 py-3.5 pr-9",
          "border-l-4",
          config.bg,
          config.accent,
        )}
        asChild
        // We're managing animation via Framer Motion, suppress Radix's own
        forceMount
      >
        <div>
          <span className="shrink-0 mt-0.5">{config.icon}</span>
          <div className="min-w-0 flex-1">
            <RadixToast.Title className="text-sm font-semibold text-text leading-snug">
              {t.title}
            </RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-xs text-text-muted mt-0.5 leading-relaxed">
                {t.description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close
            onClick={onDismiss}
            className={cn(
              "absolute right-2.5 top-2.5",
              "h-5 w-5 rounded-md flex items-center justify-center",
              "text-text-subtle hover:text-text hover:bg-surface-hover",
              "transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/40",
            )}
            aria-label="Dismiss"
          >
            <X size={12} />
          </RadixToast.Close>
        </div>
      </RadixToast.Root>
    </motion.div>
  );
}

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

        {/* Animated viewport managed by Framer Motion AnimatePresence */}
        <RadixToast.Viewport
          className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 w-full max-w-sm outline-none pointer-events-none"
          asChild
        >
          <div>
            <AnimatePresence mode="popLayout" initial={false}>
              {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                  <ToastItem t={t} onDismiss={() => dismiss(t.id)} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </RadixToast.Viewport>
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
