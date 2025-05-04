import { ActionPanel, Action, Detail, LaunchProps, showToast, Toast } from "@raycast/api";
import { usePromise, runAppleScript, showFailureToast } from "@raycast/utils";
import { summarizeThread } from "./utils/summarizer.js";

interface Arguments {
  thread: string;
}

export default function Command({ arguments: { thread } }: LaunchProps<{ arguments: Arguments }>) {
  /* ---------- Helpers ---------------------- */

  /* Wrapped summarizer with Animated Toast */
  async function handleSummarize(thread: string) {
    // Animated toast while the summary is being generated
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Generating summary...",
    });

    try {
      const summary = await summarizeThread(thread);

      toast.style = Toast.Style.Success;
      toast.title = "Completed";
      toast.message = "Summary generated successfully.";

      return summary;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Couldn't generate summary";
      if (error instanceof Error) {
        toast.message = error.message;
      }
      // Rethrow so the hook can propagate the error to the UI
      throw error;
    }
  }

  /* Render the markdown inside a tiny HTML shell and open it via AppleScript */
  async function handleOpenHtml() {
    if (!summary) return;

    const html = `<html><meta charset="utf-8"><body>
      <pre style="white-space:pre-wrap;font-family:inherit">
      ${summary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </pre></body></html>`;

    const uri = `data:text/html,${encodeURIComponent(html)}`;

    try {
      // Uses the default browser via AppleScript
      await runAppleScript(`
        tell application "Chrome"
          activate
          open location "${uri}"
        end tell
      `);
    } catch (err) {
      showFailureToast("Unable to open in browser", err as Error);
    }
  }

  /* ---------- Data fetching ---------- */
  const { isLoading, data: summary, error, revalidate } = usePromise(handleSummarize, [thread]);

  /* ---------- UI ---------- */
  return (
    <Detail
      isLoading={isLoading}
      markdown={error ? `**Error:** Couldn't generate summary.\n\n\${error.message}` : (summary ?? "Summarizing…")}
      navigationTitle="Thread Summary"
      actions={
        <ActionPanel>
          <Action title="Regenerate" onAction={revalidate} />
          <Action title="Open in HTML" onAction={handleOpenHtml} />
        </ActionPanel>
      }
    />
  );
}
