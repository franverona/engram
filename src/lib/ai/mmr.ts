// Measures how similar two embedding vectors are by computing the cosine of the
// angle between them. Returns a value between -1 and 1: 1 means identical
// meaning, 0 means unrelated, -1 means opposite. We compute it from scratch
// rather than using a library because the vectors are plain Float32Arrays.
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Selects k notes from the candidates using Maximal Marginal Relevance.
// At each step it picks the candidate that best balances two goals:
//   - relevance: how similar the candidate is to the query
//   - diversity: how different the candidate is from already-selected notes
// lambda controls the balance: 1.0 = pure relevance (same as top-k),
// 0.0 = pure diversity, 0.5 (default) = equal weight.
export function mmr(
  queryEmbedding: Float32Array,
  candidates: { note_id: number; embedding: Float32Array }[],
  k: number,
  lambda = 0.5,
): number[] {
  const selected: typeof candidates = []
  const remaining = [...candidates]

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0
    let bestScore = -Infinity

    for (let i = 0; i < remaining.length; i++) {
      const relevance = cosineSimilarity(queryEmbedding, remaining[i].embedding)
      // Redundancy is the similarity to the most similar already-selected note.
      // On the first iteration there are no selected notes, so redundancy is 0.
      const redundancy = selected.length === 0
        ? 0
        : selected.reduce((max, s) => {
          const sim = cosineSimilarity(remaining[i].embedding, s.embedding)
          return sim > max ? sim : max
        }, -Infinity)

      const score = lambda * relevance - (1 - lambda) * redundancy
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    selected.push(remaining[bestIdx])
    remaining.splice(bestIdx, 1)
  }

  return selected.map((s) => s.note_id)
}
