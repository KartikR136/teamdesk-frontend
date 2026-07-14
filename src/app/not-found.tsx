import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <FileQuestion size={28} className="mx-auto text-text-subtle mb-3" />
        <h1 className="text-lg font-semibold text-text">Page not found</h1>
        <p className="text-sm text-text-muted mt-1.5">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-5 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
