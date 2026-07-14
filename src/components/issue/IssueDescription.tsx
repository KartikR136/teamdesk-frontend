export function IssueDescription({ description }: { description: string | null }) {
  if (!description) {
    return (
      <p className="text-sm text-text-subtle italic">No description provided.</p>
    );
  }

  // Plain text rendering only — the schema field is a bare String? with no
  // markdown/rich-text indication. Isolated as its own component (rather
  // than folded into IssueMetadata) specifically so upgrading to markdown
  // rendering, attachments, or images later only touches this file.
  return (
    <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
      {description}
    </p>
  );
}
