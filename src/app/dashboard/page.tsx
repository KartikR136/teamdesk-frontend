"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useOrg } from "@/lib/OrgContext";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { currentOrg, loading: orgLoading } = useOrg();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    apiFetch(`/api/organizations/${currentOrg.id}/projects`)
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [currentOrg]);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setError("");
    try {
      const project = await apiFetch(
        `/api/organizations/${currentOrg.id}/projects`,
        {
          method: "POST",
          body: JSON.stringify({ name: newName }),
        },
      );
      setProjects((prev) => [...prev, project]);
      setNewName("");
    } catch {
      setError("Could not create project — check your role permissions");
    }
  }

  const canCreate =
    currentOrg != null &&
    ["ADMIN", "MANAGER", "MEMBER"].includes(currentOrg.role);

  return (
    <ProtectedRoute>
      <OrgSwitcher />
      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
          <button onClick={logout} className="text-sm underline">
            Log out
          </button>
        </div>

        {orgLoading && <p>Loading organizations...</p>}
        {!orgLoading && !currentOrg && (
          <p>
            You don&apos;t belong to any organization yet — create one above.
          </p>
        )}

        {currentOrg && (
          <>
            <h2 className="font-semibold mb-2">
              Projects in {currentOrg.name}
            </h2>
            <ul className="mb-4 space-y-1">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="text-blue-600 underline"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
              {projects.length === 0 && (
                <li className="text-gray-500">No projects yet.</li>
              )}
            </ul>

            {/* Role-aware UI: hiding this for VIEWER is UX only —
                the backend's requireRole("MEMBER") is the real enforcement. */}
            {canCreate && (
              <form onSubmit={handleCreateProject} className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New project name"
                  className="border p-2 rounded"
                  required
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  Create
                </button>
              </form>
            )}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
