"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/activity/formatter";
import type { Comment, Role } from "@/types";

export function IssueComments({
  comments,
  currentUserId,
  currentUserRole,
  onAdd,
  onEdit,
  onDelete,
}: {
  comments: Comment[];
  currentUserId: string | undefined;
  /** The viewer's role in the current org — closes a real gap named since
   * M2: the backend allows author-OR-admin to edit/delete, but the
   * frontend previously only ever knew about self-authorship because this
   * value was never threaded through, even though useOrg() already
   * exposed it. */
  currentUserRole: Role | undefined;
  onAdd: (body: string) => Promise<boolean>;
  onEdit: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");

  const canModerate = currentUserRole === "ADMIN";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      const success = await onAdd(newBody.trim());
      if (success) setNewBody("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-text mb-3">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-text-subtle">
          <MessageSquare size={22} className="mx-auto mb-2 text-text-subtle" />
          <p className="text-sm">Start the discussion.</p>
          <p className="text-xs mt-0.5">Add the first comment below.</p>
        </div>
      ) : (
        <ul className="space-y-4 mb-4">
          {comments.map((comment) => {
            const canEditThis =
              currentUserId === comment.author.id || canModerate;

            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar name={comment.author.name} size="md" tone="subtle" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-text">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-text-subtle">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-text-subtle">(edited)</span>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        autoFocus
                        value={editingBody}
                        onChange={(e) => setEditingBody(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const success = await onEdit(comment.id, editingBody);
                          if (success) setEditingId(null);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-text mt-0.5">{comment.body}</p>
                  )}

                  {canEditThis && editingId !== comment.id && (
                    <div className="flex gap-3 mt-1">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingBody(comment.body);
                        }}
                        className="text-xs text-text-subtle hover:text-text transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(comment.id)}
                        className="text-xs text-text-subtle hover:text-danger transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Write a comment…"
        />
        <Button type="submit" size="sm" disabled={submitting}>
          Post
        </Button>
      </form>
    </div>
  );
}
