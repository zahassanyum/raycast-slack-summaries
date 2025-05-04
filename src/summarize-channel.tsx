import { Action, ActionPanel, Detail, Form, Toast, showToast, useNavigation, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { usePromise } from "@raycast/utils";
import { summarizeChannel } from "./utils/summarizer.js";
import { listChannels } from "./utils/slackApi.js";

export default function Command() {
  const { push } = useNavigation();
  const [isLoading, setLoading] = useState(false);
  const { data: channels, isLoading: isChannelLoading } = usePromise(listChannels, []);

  // Command‑specific OpenAI prompt from preferences
  const preferences = getPreferenceValues();
  const customPrompt = preferences.openaiPrompt;

  async function handleSubmit(values: { channel: string; days: string }) {
    // Show a toast to indicate that the summary is being generated
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Generating summary...",
    });

    setLoading(true);

    try {
      const summary = await summarizeChannel(values.channel, Number(values.days || 7), customPrompt);
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
      <Form.Dropdown id="channel" title="Channel" isLoading={isChannelLoading} throttle>
        {channels?.map((c) => <Form.Dropdown.Item key={c.id} value={c.name} title={`#${c.name}`} />)}
      </Form.Dropdown>
      <Form.TextField id="days" title="Days to Look Back" placeholder="7" defaultValue="7" />
    </Form>
  );
}
