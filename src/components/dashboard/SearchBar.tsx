"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Command-palette entry point per the spec: "no backend work required."
 * This renders the trigger and a real ⌘K/Ctrl+K key listener, and opens
 * an overlay shell with the same fields the future search would use —
 * but doesn't execute an actual search (there's no endpoint for it yet).
 * That's an honest gap, not hidden: the input is disabled with a note,
 * rather than silently accepting text that goes nowhere.
 */
export function SearchBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md text-sm text-text-subtle bg-surface-hover/60 border border-transparent hover:border-border hover:bg-surface transition-colors duration-fast"
        aria-label="Search issues, projects, developers"
      >
        <Search size={14} />
        <span>Search issues, projects, developers…</span>
        <kbd className="ml-2 text-[11px] font-medium bg-surface px-1.5 py-0.5 rounded border border-border text-text-subtle">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-text/20 backdrop-blur-[2px] z-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className="fixed left-1/2 top-24 -translate-x-1/2 z-dialog w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg p-3"
              initial={{ opacity: 0, scale: 0.97, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2 px-2 py-2 border-b border-border">
                <Search size={15} className="text-text-subtle shrink-0" />
                <input
                  autoFocus
                  disabled
                  placeholder="Search issues, projects, developers or press Ctrl + K"
                  className="flex-1 bg-transparent text-sm text-text placeholder:text-text-subtle outline-none disabled:cursor-not-allowed"
                />
              </div>
              {/* TODO: wire to a real search endpoint (likely
                  GET /api/organizations/:id/search?q=) once it exists.
                  Deliberately not accepting input yet — a disabled field
                  that's honest about not searching beats one that looks
                  functional and silently does nothing. */}
              <p className="text-xs text-text-subtle px-2 pt-3 pb-1">
                Search is coming soon — this palette is wired up and ready for
                it.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
