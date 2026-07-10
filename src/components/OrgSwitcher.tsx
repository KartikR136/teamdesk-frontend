"use client";

import { useState } from "react";
import { useOrg } from "@/lib/OrgContext";
import { apiFetch } from "@/lib/api";

export function OrgSwitcher() {
  const { orgs, currentOrg, setCurrentOrgId, refetchOrgs } = useOrg();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

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
    } catch {
      setError("Could not create organization (slug may already exist)");
    }
  }

  return (
    <div className="border-b p-3 flex items-center gap-3">
      <select
        value={currentOrg?.id ?? ""}
        onChange={(e) => setCurrentOrgId(e.target.value)}
        className="border rounded p-1"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.role})
          </option>
        ))}
      </select>

      {!creating ? (
        <button onClick={() => setCreating(true)} className="text-sm underline">
          + New organization
        </button>
      ) : (
        <form onSubmit={handleCreate} className="flex gap-2 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Org name"
            className="border p-1 rounded text-sm"
            required
          />
          <button
            type="submit"
            className="text-sm bg-black text-white px-2 py-1 rounded"
          >
            Create
          </button>
        </form>
      )}
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
