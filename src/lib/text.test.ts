import { describe, it, expect } from 'vitest'
import { calcReadingTime } from './text'

describe('text', () => {
  describe('calcReadingTime', () => {
    it('empty string', () => {
      const readingTime = calcReadingTime('')
      expect(readingTime.minutes).toBe(0)
      expect(readingTime.words).toBe(0)
    })

    it('string with whitespaces', () => {
      const readingTime = calcReadingTime('   ')
      expect(readingTime.minutes).toBe(0)
      expect(readingTime.words).toBe(0)
    })

    it('string with one word', () => {
      const readingTime = calcReadingTime('hello')
      expect(readingTime.minutes).toBe(1)
      expect(readingTime.words).toBe(1)
    })

    it('exactly 200 words gives 1 min', () => {
      const text = Array(200).fill('word').join(' ')
      const result = calcReadingTime(text)
      expect(result.words).toBe(200)
      expect(result.minutes).toBe(1)
    })

    it('201 words rounds up to 2 min', () => {
      const text = Array(201).fill('word').join(' ')
      expect(calcReadingTime(text).minutes).toBe(2)
    })

    it('handles newlines and tabs as word separators', () => {
      const result = calcReadingTime('hello\nworld\there')
      expect(result.words).toBe(3)
    })

    it('multiple spaces between words count as one separator', () => {
      expect(calcReadingTime('one   two   three').words).toBe(3)
    })
  })
})
