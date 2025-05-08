import {
  ActionPanel,
  Action,
  Detail,
  Form,
  LaunchProps,
  showToast,
  Toast,
  getPreferenceValues,
  Clipboard,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState, useEffect } from "react";
import { summarizeThread } from "./utils/summarizer";

interface Arguments {
  thread?: string;
}

interface Preferences {
  openaiPrompt: string;
}

// Custom hook for handling toast notifications
function useToast() {
  const showLoadingToast = async (title: string) => {
    return await showToast({
      style: Toast.Style.Animated,
      title,
    });
  };

  const showSuccessToast = async (toast: Toast, title: string, message: string) => {
    toast.style = Toast.Style.Success;
    toast.title = title;
    toast.message = message;
  };

  const showErrorToast = async (toast: Toast, title: string, error: unknown) => {
    toast.style = Toast.Style.Failure;
    toast.title = title;
    toast.message = error instanceof Error ? error.message : String(error);
  };

  return { showLoadingToast, showSuccessToast, showErrorToast };
}

// Thread Input Form Component
function ThreadInputForm({ onSubmit }: { onSubmit: (thread: string) => void }) {
  const [inputValue, setInputValue] = useState<string>("");

  function isSlackLink(text: string): boolean {
    const slackRegex = /^https?:\/\/[\w.-]+\.slack\.com\/archives\/\w+\/p\d+$/i;
    return slackRegex.test(text.trim());
  }

  useEffect(() => {
    const checkClipboard = async () => {
      const text = await Clipboard.readText();
      if (text && isSlackLink(text)) {
        setInputValue(text);
      }
    };
    checkClipboard();
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Summarize" onSubmit={(values: { thread: string }) => onSubmit(values.thread)} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="thread"
        title="Thread (or Message) URL"
        placeholder="Paste Slack thread link…"
        value={inputValue}
        onChange={setInputValue}
      />
    </Form>
  );
}

// Summary Display Component
function SummaryDisplay({
  isLoading,
  summary,
  error,
  onRegenerate,
}: {
  isLoading: boolean;
  summary?: string;
  error?: Error;
  onRegenerate: () => void;
}) {
  const markdown = error
    ? `**Error:** Couldn't generate summary.\n\n\`\`${error.message}\`\``
    : (summary ?? "Summarizing…");

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle="Thread summary"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Summary" content={summary ?? ""} />
          <Action title="Regenerate" onAction={onRegenerate} />
        </ActionPanel>
      }
    />
  );
}

export default function Command({ arguments: { thread: initialThread } }: LaunchProps<{ arguments: Arguments }>) {
  const [thread, setThread] = useState<string | undefined>(initialThread);
  const preferences = getPreferenceValues<Preferences>();
  const { showLoadingToast, showSuccessToast, showErrorToast } = useToast();

  const handleSummarize = async (threadURL: string) => {
    const toast = await showLoadingToast("Generating summary...");

    try {
      const summary = await summarizeThread(threadURL, preferences.openaiPrompt);
      await showSuccessToast(toast, "Completed", "Summary generated successfully.");
      return summary;
    } catch (error) {
      await showErrorToast(toast, "Couldn't generate summary", error);
      throw error;
    }
  };

  const {
    isLoading,
    data: summary,
    error,
    revalidate,
  } = usePromise(
    async (t) => {
      if (!t) return undefined;
      return handleSummarize(t);
    },
    [thread],
  );

  if (!thread) {
    return <ThreadInputForm onSubmit={setThread} />;
  }

  return (
    <SummaryDisplay
      isLoading={isLoading}
      summary={summary}
      error={error instanceof Error ? error : undefined}
      onRegenerate={revalidate}
    />
  );
}
