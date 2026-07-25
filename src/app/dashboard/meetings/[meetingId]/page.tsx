"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FolderKanban,
  MapPin,
  Repeat,
  Trash2,
} from "lucide-react";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import type { MeetingFormValues } from "@/components/meetings/MeetingForm";
import { formValuesToStartsAt } from "@/components/meetings/MeetingForm";
import { AttendeeList } from "@/components/meetings/AttendeeList";
import { RsvpButtons } from "@/components/meetings/RsvpButtons";
import { LinkedIssuesPanel } from "@/components/meetings/LinkedIssuesPanel";
import { useAuth } from "@/providers/AuthProvider";
import { isAbortError } from "@/lib/api";
import {
  getMeeting,
  updateMeeting,
  deleteMeeting,
  rsvpToMeeting,
  updateMeetingNotes,
} from "@/lib/meetings";
import { useNotify } from "@/lib/notifications";
import type { Meeting, MeetingRsvpStatus } from "@/types";
import { MEETING_KINDS } from "@/types";

const MeetingForm = dynamic(
  () => import("@/components/meetings/MeetingForm").then((m) => m.MeetingForm),
  {
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    ),
  },
);

export default function MeetingDetailPage() {
  const params = useParams<{ meetingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const notify = useNotify();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      try {
        const data = await getMeeting(params.meetingId, controller.signal);
        setMeeting(data);
        setNotes(data.notes ?? "");
      } catch (err) {
        if (isAbortError(err)) return;
        setMeeting(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [params.meetingId]);

  const isOrganizer = meeting?.createdById === user?.id;
  const myAttendance = meeting?.attendees.find((a) => a.user.id === user?.id);
  const canEdit = isOrganizer; // UX-only; backend re-checks organizer/MANAGER+ on every write

  async function handleRsvp(status: MeetingRsvpStatus) {
    if (!meeting || !user) return;
    const previous = meeting;
    setMeeting({
      ...meeting,
      attendees: meeting.attendees.some((a) => a.user.id === user.id)
        ? meeting.attendees.map((a) =>
            a.user.id === user.id ? { ...a, status } : a,
          )
        : [
            ...meeting.attendees,
            {
              id: `temp-${user.id}`,
              status,
              respondedAt: new Date().toISOString(),
              user: { id: user.id, name: user.name, email: user.email },
            },
          ],
    });
    try {
      await rsvpToMeeting(meeting.id, status);
      notify.success("RSVP updated");
    } catch {
      setMeeting(previous);
      notify.error("Could not update RSVP", "Please try again.");
    }
  }

  async function handleSaveNotes() {
    if (!meeting) return;
    setSavingNotes(true);
    try {
      const updated = await updateMeetingNotes(meeting.id, notes || null);
      setMeeting(updated);
      notify.success("Notes saved");
    } catch {
      notify.error("Could not save notes", "Please try again.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleEditSubmit(values: MeetingFormValues) {
    if (!meeting) return;
    const updated = await updateMeeting(meeting.id, {
      title: values.title,
      kind: values.kind,
      description: values.description || null,
      startsAt: formValuesToStartsAt(values),
      durationMinutes: values.durationMinutes,
      location: values.location || null,
      projectId: values.projectId || null,
    });
    setMeeting(updated);
    setEditing(false);
    notify.success("Meeting updated");
  }

  async function handleDelete(scope: "single" | "series") {
    if (!meeting) return;
    setDeleting(true);
    try {
      await deleteMeeting(meeting.id, scope);
      notify.success(scope === "series" ? "Series cancelled" : "Meeting deleted");
      router.push("/dashboard/meetings");
    } catch {
      notify.error("Could not delete this meeting", "Please try again.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const kindLabel = meeting
    ? MEETING_KINDS.find((k) => k.value === meeting.kind)?.label ?? meeting.kind
    : "";

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link
            href="/dashboard/meetings"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Meetings
          </Link>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-32 w-full mt-6" />
            </div>
          ) : !meeting ? (
            <Card className="border-dashed px-8 py-14 text-center">
              <p className="text-text-muted">
                This meeting doesn&apos;t exist, or you don&apos;t have access to it.
              </p>
            </Card>
          ) : editing ? (
            <>
              <h1 className="text-xl font-semibold text-text tracking-tight mb-6">
                Edit meeting
              </h1>
              <MeetingForm
                organizationId={meeting.organizationId}
                initial={meeting}
                submitLabel="Save changes"
                onSubmit={handleEditSubmit}
                onCancel={() => setEditing(false)}
              />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-xl font-semibold text-text tracking-tight">
                  {meeting.title}
                </h1>
                <Badge variant="subtle">{kindLabel}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-text-subtle mb-6">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(meeting.startsAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(meeting.startsAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {meeting.durationMinutes}min
                </span>
                {meeting.project && (
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban size={12} />
                    {meeting.project.name}
                  </span>
                )}
                {meeting.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {meeting.location}
                  </span>
                )}
                {meeting.recurrenceRule !== "NONE" && (
                  <span className="inline-flex items-center gap-1">
                    <Repeat size={12} />
                    Repeats {meeting.recurrenceRule.toLowerCase()}
                  </span>
                )}
                <span>Organized by {meeting.createdBy.name}</span>
              </div>

              {meeting.description && (
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-6">
                  {meeting.description}
                </p>
              )}

              <Card className="p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide">
                    Your RSVP
                  </h2>
                </div>
                <RsvpButtons
                  current={myAttendance?.status ?? (isOrganizer ? "ACCEPTED" : undefined)}
                  onChange={(s) => void handleRsvp(s)}
                />
              </Card>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2">
                    Attendees ({meeting.attendees.length})
                  </h2>
                  <AttendeeList
                    attendees={meeting.attendees}
                    organizerId={meeting.createdById}
                  />
                </div>

                <LinkedIssuesPanel
                  meetingId={meeting.id}
                  organizationId={meeting.organizationId}
                  linkedIssues={meeting.linkedIssues}
                  onChange={(linkedIssues) =>
                    setMeeting({ ...meeting, linkedIssues })
                  }
                  canEdit={!!user}
                />

                <div>
                  <h2 className="text-xs font-medium text-text-subtle uppercase tracking-wide mb-2">
                    Notes
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Capture decisions, action items, and follow-ups while they're fresh…"
                    rows={5}
                    maxLength={20000}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors duration-normal ease-standard focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-primary hover:border-border-hover resize-y"
                  />
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={savingNotes || notes === (meeting.notes ?? "")}
                      onClick={() => void handleSaveNotes()}
                    >
                      {savingNotes ? "Saving…" : "Save notes"}
                    </Button>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                    Edit
                  </Button>

                  <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
                    <Trash2 size={14} />
                    Delete
                  </Button>

                  <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                      <DialogTitle>
                        Delete &ldquo;{meeting.title}&rdquo;?
                      </DialogTitle>
                      <DialogDescription>
                        {meeting.recurrenceRule !== "NONE"
                          ? "This is part of a recurring series. Choose whether to delete just this occurrence or every upcoming one."
                          : "This can't be undone."}
                      </DialogDescription>
                      <DialogFooter>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmOpen(false)}
                        >
                          Cancel
                        </Button>
                        {meeting.recurrenceRule !== "NONE" && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deleting}
                            onClick={() => void handleDelete("series")}
                          >
                            Delete this and future occurrences
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deleting}
                          onClick={() => void handleDelete("single")}
                        >
                          {deleting ? "Deleting…" : "Delete this occurrence"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
