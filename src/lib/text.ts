type ReadingTime = {
  words: number
  minutes: number
}
export function calcReadingTime(text: string): ReadingTime {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.ceil(words / 200)
  return { words, minutes }
}
