import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function IssueHeader({
  title,
  projectId,
}: {
  title: string;
  projectId: string;
}) {
  return (
    <div className="mb-6">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-3"
      >
        <ChevronLeft size={14} />
        Back to project
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-text leading-snug">
        {title}
      </h1>
    </div>
  );
}
