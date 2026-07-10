"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/OrgContext";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Issue {
  id: string;
  title: string;
  status: string;
  projectId: string;
  assignee: { id: string; name: string } | null;
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    apiFetch(`/api/organizations/${currentOrg.id}/projects/${projectId}/issues`)
      .then(setIssues)
      .catch(() => setIssues([]));
  }, [currentOrg, projectId]);

  async function handleCreateIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setError("");
    try {
      const issue = await apiFetch(
        `/api/organizations/${currentOrg.id}/issues`,
        {
          method: "POST",
          body: JSON.stringify({ title, projectId }),
        },
      );
      setIssues((prev) => [...prev, issue]);
      setTitle("");
    } catch {
      setError("Could not create issue");
    }
  }

  async function updateStatus(issueId: string, status: string) {
    try {
      await apiFetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status } : i)),
      );
    } catch {
      setError("Could not update issue");
    }
  }

  return (
    <ProtectedRoute>
      <main className="p-8">
        <a href="/dashboard" className="text-sm underline">
          ← back to projects
        </a>
        <h1 className="text-xl font-bold my-4">Issues</h1>

        <ul className="space-y-2 mb-6">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <span>{issue.title}</span>
              <select
                value={issue.status}
                onChange={(e) => updateStatus(issue.id, e.target.value)}
                className="border rounded p-1 text-sm"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </li>
          ))}
          {issues.length === 0 && (
            <li className="text-gray-500">No issues yet.</li>
          )}
        </ul>

        <form onSubmit={handleCreateIssue} className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New issue title"
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add issue
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </main>
    </ProtectedRoute>
  );
}
