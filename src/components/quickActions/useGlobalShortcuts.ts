"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuickActions } from "./QuickActionsProvider";

/**
 * Two-key chord shortcuts — "c" then "i", "c" then "p", etc. — mirroring
 * the hints Quick Actions has displayed on its tiles since the very
 * first version of that widget (C I, C P, G D, G M, C S). Those hints
 * were purely decorative until now: nothing in the app actually listened
 * for them. This hook is the other half of that promise, and is mounted
 * once in DashboardShell so the shortcuts work from any page, not just
 * while the Quick Actions widget happens to be visible.
 *
 * Deliberately ignores chords while focus is inside a text input,
 * textarea, select, or contenteditable element — otherwise typing the
 * letter "c" followed by "i" inside an issue description would
 * unexpectedly pop open the Create Issue dialog.
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const { openCreateIssue, openCreateProject, openCreateSprint } = useQuickActions();
  const pendingKey = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    }

    function clearPending() {
      pendingKey.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (pendingKey.current) {
        const chord = pendingKey.current + key;
        clearPending();

        switch (chord) {
          case "ci":
            e.preventDefault();
            openCreateIssue();
            return;
          case "cp":
            e.preventDefault();
            openCreateProject();
            return;
          case "cs":
            e.preventDefault();
            openCreateSprint();
            return;
          case "gd":
            e.preventDefault();
            router.push("/dashboard/decisions/new");
            return;
          case "gm":
            e.preventDefault();
            router.push("/dashboard/members");
            return;
          default:
            // Not a recognized chord — fall through in case the second
            // key is itself the start of a new chord (e.g. "g" "g").
            break;
        }
      }

      if (key === "c" || key === "g") {
        pendingKey.current = key;
        timeoutRef.current = setTimeout(clearPending, 800);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearPending();
    };
  }, [router, openCreateIssue, openCreateProject, openCreateSprint]);
}
