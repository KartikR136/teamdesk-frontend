"use client";

import { useRouter } from "next/navigation";
import { useOrg } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  MeetingForm,
  formValuesToStartsAt,
  type MeetingFormValues,
} from "@/components/meetings/MeetingForm";
import { createMeeting } from "@/lib/meetings";
import { useNotify } from "@/lib/notifications";
import type { Meeting } from "@/types";

export default function NewMeetingPage() {
  const { currentOrg } = useOrg();
  const router = useRouter();
  const notify = useNotify();

  async function handleSubmit(values: MeetingFormValues) {
    if (!currentOrg) return;

    const result = await createMeeting(currentOrg.id, {
      title: values.title,
      kind: values.kind,
      description: values.description || undefined,
      startsAt: formValuesToStartsAt(values),
      durationMinutes: values.durationMinutes,
      location: values.location || undefined,
      projectId: values.projectId || null,
      attendeeUserIds: values.attendeeUserIds,
      linkedIssueIds: values.linkedIssueIds,
      recurrenceRule: values.recurrenceRule,
      occurrenceCount:
        values.recurrenceRule !== "NONE" ? values.occurrenceCount : undefined,
    });

    const isSeries = "series" in result;
    const first: Meeting = isSeries ? result.series[0] : result;

    notify.success(
      isSeries ? `${result.series.length} meetings scheduled` : "Meeting scheduled",
      first.title,
    );
    router.push(`/dashboard/meetings/${first.id}`);
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-xl font-semibold text-text tracking-tight mb-1">
            Schedule a meeting
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Invite the right people, link the issues you&apos;ll actually
            discuss, and set it up to repeat if it&apos;s a recurring sync.
          </p>

          {currentOrg && (
            <MeetingForm
              organizationId={currentOrg.id}
              submitLabel="Schedule meeting"
              onSubmit={handleSubmit}
              onCancel={() => router.push("/dashboard/meetings")}
            />
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
