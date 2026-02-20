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
