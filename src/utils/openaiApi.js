import OpenAI from "openai";
import { getPreferenceValues } from "@raycast/api";

const preferences = getPreferenceValues();
const apiKey = preferences.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey });

async function callOpenAIChatCompletion(messages) {
  const res = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.2,
    messages,
  });
  return res.choices?.[0]?.message?.content?.trim() || "[No summary]";
}

export async function callOpenAI(promptBody, channelName) {
  console.log("Calling OpenAI (channel prompt)…");
  const messages = [
    {
      role: "user",
      content: [
        `Summarize the following Slack conversations from #${channelName}.`,
        `Combine the messages into a concise digest with bullet points.`,
        `Each message is prefixed with the user name.`,
        `If an item contains multiple messages, that means it's a discussion.`,
        `Omit greetings and signatures.`,
        "",
        promptBody,
      ].join("\n"),
    },
  ];
  return callOpenAIChatCompletion(messages);
}

export async function callOpenAIThread(promptBody) {
  console.log("Calling OpenAI (thread prompt)…");
  const messages = [
    {
      role: "user",
      content: [
        `Summarize the following Slack thread.`,
        `Each message is prefixed with the user name.`,
        `Omit greetings and signatures.`,
        `Highlight decisions and next steps at the end if necessary.`,
        "",
        promptBody,
      ].join("\n"),
    },
  ];
  return callOpenAIChatCompletion(messages);
}
