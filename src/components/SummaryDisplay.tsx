import { Action, ActionPanel, Detail } from "@raycast/api";

interface SummaryDisplayProps {
  isLoading: boolean;
  summary?: string;
  error?: Error;
  onRegenerate: () => void;
  navigationTitle: string;
}

export function SummaryDisplay({
  isLoading,
  summary,
  error,
  onRegenerate,
  navigationTitle,
}: SummaryDisplayProps) {
  const markdown = error
    ? `**Error:** Couldn't generate summary.\n\n\`\`${error.message}\`\``
    : (summary ?? "Summarizing…");

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={navigationTitle}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Summary" content={summary ?? ""} />
          <Action title="Regenerate" onAction={onRegenerate} />
        </ActionPanel>
      }
    />
  );
} 