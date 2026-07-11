"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/lib/OrgContext";
import { useAuth } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Issue {
  id: string;
  title: string;
  status: string;
  projectId: string;
  assignee: { id: string; name: string } | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
}

interface PaginatedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  // Which issue's comment thread is currently expanded (one at a time).
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg) return;
    // Since M1, list endpoints return { data, hasNextPage, nextCursor } —
    // not a bare array. Not implementing "load more" here yet; that's a
    // frontend pagination-controls task for M6, out of scope for this fix.
    apiFetch(`/api/organizations/${currentOrg.id}/projects/${projectId}/issues`)
      .then((res: PaginatedResponse<Issue>) => setIssues(res.data))
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
            <li key={issue.id} className="border rounded">
              <div className="p-3 flex justify-between items-center">
                <button
                  onClick={() =>
                    setExpandedIssueId((prev) =>
                      prev === issue.id ? null : issue.id,
                    )
                  }
                  className="text-left underline-offset-2 hover:underline"
                >
                  {issue.title}
                </button>
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
              </div>

              {expandedIssueId === issue.id && (
                <CommentThread issueId={issue.id} currentUserId={user?.id} />
              )}
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

function CommentThread({
  issueId,
  currentUserId,
}: {
  issueId: string;
  currentUserId: string | undefined;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newBody, setNewBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/issues/${issueId}/comments`)
      .then((res: PaginatedResponse<Comment>) => setComments(res.data))
      .catch(() => setError("Could not load comments"))
      .finally(() => setLoading(false));
  }, [issueId]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newBody.trim()) return;
    setError("");
    try {
      const comment = await apiFetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: newBody }),
      });
      // Newest-first, matching the backend's createdAt desc ordering.
      setComments((prev) => [comment, ...prev]);
      setNewBody("");
    } catch {
      setError("Could not post comment");
    }
  }

  async function handleSaveEdit(commentId: string) {
    if (!editingBody.trim()) return;
    setError("");
    try {
      const updated = await apiFetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ body: editingBody }),
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c)),
      );
      setEditingId(null);
      setEditingBody("");
    } catch {
      setError("Could not save edit");
    }
  }

  async function handleDelete(commentId: string) {
    setError("");
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError("Could not delete comment");
    }
  }

  return (
    <div className="border-t bg-gray-50 p-3 space-y-3">
      {loading && <p className="text-sm text-gray-500">Loading comments…</p>}

      {!loading && comments.length === 0 && (
        <p className="text-sm text-gray-500">No comments yet.</p>
      )}

      <ul className="space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="text-sm bg-white border rounded p-2">
            <div className="flex justify-between items-baseline">
              <span className="font-medium">{comment.author.name}</span>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleString()}
                {comment.updatedAt !== comment.createdAt && " (edited)"}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="mt-1 flex gap-2">
                <input
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  className="border rounded p-1 flex-1 text-sm"
                />
                <button
                  onClick={() => handleSaveEdit(comment.id)}
                  className="text-xs bg-black text-white px-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs px-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="mt-1">{comment.body}</p>
            )}

            {/* Author-only actions — matches the backend's ownership rule
                (author or ADMIN can edit/delete). ADMIN override isn't
                exposed in this UI yet since the frontend doesn't currently
                know the viewer's org role on this page; only self-authored
                edit/delete is wired up here. */}
            {currentUserId === comment.author.id &&
              editingId !== comment.id && (
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditingBody(comment.body);
                    }}
                    className="underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="underline"
                  >
                    Delete
                  </button>
                </div>
              )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddComment} className="flex gap-2">
        <input
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Write a comment…"
          className="border rounded p-1 flex-1 text-sm"
        />
        <button
          type="submit"
          className="text-xs bg-black text-white px-3 rounded"
        >
          Post
        </button>
      </form>

      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
