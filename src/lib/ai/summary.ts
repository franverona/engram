import 'server-only'
import { generateText } from 'ai'
import { chatModel } from './ollama'

export async function generateNoteSummary(
  title: string,
  body: string
): Promise<string> {
  const { text } = await generateText({
    model: chatModel,
    prompt: `Return a one-sentence summary for this note. I only want the summary, do not add anything additional:\n\n${title}\n${body}`,
  })
  return text
}

export async function generateChatMessageSummary(message: string): Promise<string> {
  const { text } = await generateText({
    model: chatModel,
    prompt: `Summarize this in 5 words or fewer. Do not add any punctuation. I want the result in the same language as the provided message. Also, do not add anything additional as I only want the summary:\n\n${message}`,
  })
  return text
}
