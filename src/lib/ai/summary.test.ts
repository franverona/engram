import { generateText } from 'ai'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateNoteSummary } from './summary'

vi.mock('server-only', () => ({}))
vi.mock('ai', () => ({
  generateText: vi.fn(),
}))
vi.mock('./ollama', () => ({
  chatModel: {},
}))

const mockGenerateText = vi.mocked(generateText)

describe('generateNoteSummary', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  it('returns the text from generateText', async () => {
    mockGenerateText.mockResolvedValue({ text: 'A short summary.' } as never)
    const result = await generateNoteSummary('My Note', 'Some body content.')
    expect(result).toBe('A short summary.')
  })

  it('calls generateText with the title and body in the prompt', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Summary.' } as never)
    await generateNoteSummary('My Note', 'Some body content.')
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('My Note'),
      }),
    )
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Some body content.'),
      }),
    )
  })

  it('calls generateText exactly once', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Summary.' } as never)
    await generateNoteSummary('Title', 'Body')
    expect(mockGenerateText).toHaveBeenCalledTimes(1)
  })

  it('propagates errors thrown by generateText', async () => {
    mockGenerateText.mockRejectedValue(new Error('Ollama unreachable'))
    await expect(generateNoteSummary('Title', 'Body')).rejects.toThrow('Ollama unreachable')
  })
})
