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
    <div className="mb-5">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ChevronLeft size={14} />
        Back to project
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-text mt-2">
        {title}
      </h1>
    </div>
  );
}
