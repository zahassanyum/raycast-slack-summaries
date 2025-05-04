import { Action, ActionPanel, Detail, Form, Toast, showToast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { summarizeChannel } from "./utils/summarizer.js";

export default function Command() {
  const { push } = useNavigation();
  const [isLoading, setLoading] = useState(false);

  async function handleSubmit(values: { channel: string; days: string }) {
    // Show a toast to indicate that the summary is being generated
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Generating summary...",
    });

    setLoading(true);

    try {
      const summary = await summarizeChannel(values.channel, Number(values.days || 7));
      push(<Detail markdown={summary} navigationTitle={`#${values.channel}`} />);

      toast.style = Toast.Style.Success;
      toast.title = "Completed";
      toast.message = `Summary for #${values.channel} generated successfully.`;
    } catch (err) {
      toast.style = Toast.Style.Failure;
      toast.title = "Couldn't generate summary";
      if (err instanceof Error) {
        toast.message = err.message;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Summarize" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="channel" title="Channel Name" placeholder="general" />
      <Form.TextField id="days" title="Days to Look Back" placeholder="7" />
    </Form>
  );
}
