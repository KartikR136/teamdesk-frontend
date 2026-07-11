"use client";

import { useState, useRef, useEffect } from "react";
import { useOrg } from "@/lib/OrgContext";
import { apiFetch } from "@/lib/api";
import { RoleBadge } from "@/components/RoleBadge";

export function OrgSwitcher() {
  const { orgs, currentOrg, setCurrentOrgId, refetchOrgs } = useOrg();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    try {
      const org = await apiFetch("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name, slug }),
      });
      await refetchOrgs();
      setCurrentOrgId(org.id);
      setName("");
      setCreating(false);
      setOpen(false);
    } catch {
      setError(
        "Could not create organization — that name may already be taken",
      );
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition-all"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-semibold">
          {currentOrg?.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="text-sm font-medium text-zinc-900">
          {currentOrg?.name ?? "Select organization"}
        </span>
        {currentOrg && <RoleBadge role={currentOrg.role} />}
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl border border-zinc-200 bg-white shadow-lg shadow-zinc-900/5 py-1.5 z-20">
          <ul className="max-h-72 overflow-y-auto">
            {orgs.map((org) => (
              <li key={org.id}>
                <button
                  onClick={() => {
                    setCurrentOrgId(org.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors ${
                    org.id === currentOrg?.id ? "bg-indigo-50/60" : ""
                  }`}
                >
                  <span className="flex items-center gap-2 text-zinc-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-semibold text-zinc-500">
                      {org.name[0]?.toUpperCase()}
                    </span>
                    {org.name}
                  </span>
                  <RoleBadge role={org.role} />
                </button>
              </li>
            ))}
            {orgs.length === 0 && (
              <li className="px-3 py-2 text-sm text-zinc-400">
                No organizations yet
              </li>
            )}
          </ul>

          <div className="border-t border-zinc-100 mt-1 pt-1">
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50/60 transition-colors font-medium"
              >
                + New organization
              </button>
            ) : (
              <form onSubmit={handleCreate} className="flex gap-1.5 px-3 py-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Organization name"
                  className="flex-1 border border-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  required
                />
                <button
                  type="submit"
                  className="text-sm bg-indigo-600 text-white px-2.5 py-1 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
              </form>
            )}
            {error && <p className="text-red-600 text-xs px-3 pb-1">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
