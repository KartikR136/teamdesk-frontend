"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  ScrollText,
  Users,
  Activity,
  Plus,
  FolderPlus,
  Rows3,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/providers/OrgProvider";
import { apiFetch, isAbortError } from "@/lib/api";
import { useQuickActions } from "@/components/quickActions/QuickActionsProvider";
import type { Issue, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils";
import { KBD } from "./KBD";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string[];
}

interface CommandPaletteContextValue {
  open: boolean;
  openPalette: () => void;
  closePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: false,
  openPalette: () => {},
  closePalette: () => {},
});

/* ── Static commands ────────────────────────────────────────────────────── */

const STATIC_COMMANDS: CommandItem[] = [
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    icon: <LayoutDashboard size={15} />,
    href: "/dashboard",
    group: "Navigation",
    keywords: ["home", "projects"],
  },
  {
    id: "nav-projects",
    label: "View Projects",
    icon: <FolderOpen size={15} />,
    href: "/dashboard",
    group: "Navigation",
    keywords: ["project"],
  },
  {
    id: "nav-decisions",
    label: "Decision Log",
    icon: <ScrollText size={15} />,
    href: "/dashboard/decisions",
    group: "Navigation",
    keywords: ["decision", "log", "adr"],
  },
  {
    id: "nav-members",
    label: "Members",
    icon: <Users size={15} />,
    href: "/dashboard/members",
    group: "Navigation",
    keywords: ["team", "people"],
  },
  {
    id: "nav-activity",
    label: "Activity Log",
    icon: <Activity size={15} />,
    href: "/dashboard/activity",
    group: "Navigation",
    keywords: ["audit", "history"],
  },
  {
    id: "nav-issues",
    label: "Issues",
    icon: <ListTodo size={15} />,
    href: "/dashboard",
    group: "Navigation",
    keywords: ["bug", "task", "issue"],
  },
  {
    id: "nav-sprints",
    label: "Sprints",
    icon: <Rows3 size={15} />,
    href: "/dashboard/sprints",
    group: "Navigation",
    keywords: ["sprint", "iteration", "agile"],
  },
];

/* ── Provider ───────────────────────────────────────────────────────────── */

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider
      value={{
        open,
        openPalette: () => setOpen(true),
        closePalette: () => setOpen(false),
      }}
    >
      {children}
      <CommandPaletteDialog
        open={open}
        onClose={() => setOpen(false)}
      />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

/* ── Dialog ─────────────────────────────────────────────────────────────── */

function CommandPaletteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { openCreateIssue, openCreateProject, openCreateSprint } = useQuickActions();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [issueResults, setIssueResults] = useState<Issue[]>([]);
  const [searchingIssues, setSearchingIssues] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Action commands — these run a dialog rather than navigating, so they
  // have to be built inside the component (they close over the live
  // openCreate* handlers from QuickActionsProvider) rather than living in
  // the module-level STATIC_COMMANDS array above.
  const actionCommands: CommandItem[] = useMemo(
    () => [
      {
        id: "action-create-issue",
        label: "Create Issue",
        description: "Open a new issue in any project",
        icon: <Plus size={15} />,
        action: () => openCreateIssue(),
        group: "Create",
        keywords: ["new", "issue", "bug", "task"],
      },
      {
        id: "action-create-project",
        label: "Create Project",
        icon: <FolderPlus size={15} />,
        action: () => openCreateProject(),
        group: "Create",
        keywords: ["new", "project"],
      },
      {
        id: "action-create-sprint",
        label: "Create Sprint",
        description: "Plan a new iteration for a project",
        icon: <Rows3 size={15} />,
        action: () => openCreateSprint(),
        group: "Create",
        keywords: ["new", "sprint", "iteration"],
      },
    ],
    [openCreateIssue, openCreateProject, openCreateSprint],
  );

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setIssueResults([]);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Live issue search — debounced, hits the same GET
  // /organizations/:id/issues endpoint the Issues list page uses, with
  // the new ?q= param (see routes/issues.ts). Only fires once the user
  // has typed something; the static/action commands above already cover
  // the empty-query case.
  useEffect(() => {
    const q = query.trim();
    if (!open || !currentOrg || q.length < 2) {
      setIssueResults([]);
      setSearchingIssues(false);
      return;
    }
    setSearchingIssues(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      apiFetch<PaginatedResponse<Issue>>(
        `/api/organizations/${currentOrg.id}/issues?q=${encodeURIComponent(q)}&limit=5`,
        { signal: controller.signal },
      )
        .then((res) => setIssueResults(res.data))
        .catch((err) => {
          if (!isAbortError(err)) setIssueResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchingIssues(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, currentOrg]);

  const issueCommands: CommandItem[] = useMemo(
    () =>
      issueResults.map((issue) => ({
        id: `issue-${issue.id}`,
        label: issue.title,
        description: issue.assignee ? `Assigned to ${issue.assignee.name}` : "Unassigned",
        icon: <ListTodo size={15} />,
        href: `/dashboard/projects/${issue.projectId}/issues/${issue.id}`,
        group: "Issues",
        keywords: [],
      })),
    [issueResults],
  );

  // Filter commands. Action commands are always keyword-matched like
  // static ones; issue results are already server-filtered by `q`, so
  // they're appended as-is rather than re-filtered client-side.
  const q = query.toLowerCase();
  const filteredBase = [...actionCommands, ...STATIC_COMMANDS].filter((cmd) => {
    if (!query.trim()) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });
  const filtered = query.trim() ? [...issueCommands, ...filteredBase] : filteredBase;

  // Group results
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  // Flat list for keyboard navigation
  const flatItems = Object.values(groups).flat();

  function run(item: CommandItem) {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) run(item);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-overlay bg-text/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="fixed left-1/2 top-1/4 -translate-x-1/2 z-command w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search size={16} className="text-text-subtle shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                  onKeyDown={onKeyDown}
                  className="flex-1 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
                  placeholder="Search issues, or navigate…"
                  aria-label="Command palette search"
                  autoComplete="off"
                  spellCheck={false}
                />
                {searchingIssues && (
                  <Loader2 size={14} className="text-text-subtle animate-spin shrink-0" />
                )}
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-text-subtle hover:text-text transition-colors"
                    tabIndex={-1}
                  >
                    <X size={14} />
                  </button>
                )}
                <KBD>Esc</KBD>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-72 overflow-y-auto overscroll-contain py-2"
                role="listbox"
              >
                {flatItems.length === 0 ? (
                  <p className="px-4 py-8 text-sm text-text-subtle text-center">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  Object.entries(groups).map(([group, items]) => (
                    <div key={group}>
                      <p className="px-3 py-1.5 text-[11px] font-semibold text-text-subtle uppercase tracking-wider">
                        {group}
                      </p>
                      {items.map((item) => {
                        const globalIdx = flatItems.indexOf(item);
                        const isActive = globalIdx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => run(item)}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left",
                              "transition-colors duration-fast",
                              isActive
                                ? "bg-primary-subtle text-text"
                                : "text-text-muted hover:bg-surface-hover",
                            )}
                          >
                            <span className={cn("shrink-0", isActive ? "text-primary" : "text-text-subtle")}>
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-text">
                                {item.label}
                              </span>
                              {item.description && (
                                <p className="text-xs text-text-muted truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isActive && (
                              <ArrowRight size={14} className="text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-surface-hover/50">
                <span className="flex items-center gap-1 text-[11px] text-text-subtle">
                  <KBD>↑</KBD><KBD>↓</KBD> navigate
                </span>
                <span className="flex items-center gap-1 text-[11px] text-text-subtle">
                  <KBD>↵</KBD> open
                </span>
                <span className="flex items-center gap-1 text-[11px] text-text-subtle ml-auto">
                  <KBD>⌘K</KBD> toggle
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
