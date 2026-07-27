"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotify } from "@/lib/notifications";
import { apiFetch, ApiError } from "@/lib/api";

export function WebhookSetupCard({
  webhookUrl,
  snippet,
  onRotated,
}: {
  webhookUrl: string | null;
  snippet: string;
  onRotated: (url: string | null) => void;
}) {
  const notify = useNotify();
  const [copied, setCopied] = useState<"url" | "snippet" | null>(null);
  const [rotating, setRotating] = useState(false);

  async function copy(text: string, which: "url" | "snippet") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleRotate() {
    setRotating(true);
    try {
      const res = await apiFetch<{ webhookUrl: string | null }>(
        "/api/dashboard/coding-streak/webhook/rotate",
        { method: "POST" },
      );
      onRotated(res.webhookUrl);
      notify.success("Webhook URL rotated — update it in GitHub");
    } catch (err) {
      notify.error(
        "Couldn't rotate webhook",
        err instanceof ApiError ? err.message : undefined,
      );
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-subtle leading-relaxed">
        Connect a real repo to turn{" "}
        <span className="font-medium text-text">Commits</span> from an honest
        zero into a real, attributable count. Add this as a repo webhook
        (Settings → Webhooks → content type <code>application/json</code>, event{" "}
        <code>push</code>), or drop the GitHub Actions step below into any
        workflow.
      </p>

      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md bg-surface-hover px-3 py-2 text-xs text-text">
          {webhookUrl ??
            "Set BACKEND_BASE_URL to generate a copyable webhook URL"}
        </code>
        {webhookUrl && (
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => copy(webhookUrl, "url")}
            aria-label="Copy webhook URL"
          >
            {copied === "url" ? <Check size={13} /> : <Copy size={13} />}
          </Button>
        )}
      </div>

      <div className="relative">
        <pre className="rounded-md bg-surface-hover px-3 py-2.5 text-[11px] text-text overflow-x-auto">
          {snippet}
        </pre>
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute top-2 right-2"
          onClick={() => copy(snippet, "snippet")}
          aria-label="Copy GitHub Actions snippet"
        >
          {copied === "snippet" ? <Check size={13} /> : <Copy size={13} />}
        </Button>
      </div>

      <Button
        size="xs"
        variant="ghost"
        leftIcon={<RefreshCw size={12} />}
        onClick={handleRotate}
        loading={rotating}
      >
        Rotate webhook token
      </Button>

      <p className="flex items-center gap-1.5 text-[11px] text-text-subtle pt-1">
        <GitBranch size={12} />
        Works with any host that can POST JSON — GitHub, GitLab, or a plain curl
        call.
      </p>
    </div>
  );
}
