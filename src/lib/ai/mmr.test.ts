import { describe, it, expect } from 'vitest'
import { mmr } from './mmr'

describe('mmr', () => {
  it('returns empty array when candidates is empty', () => {
    const query = new Float32Array([1, 0, 0])
    expect(mmr(query, [], 5)).toEqual([])
  })

  it('returns all candidates when k exceeds candidate count', () => {
    const query = new Float32Array([1, 0, 0])
    const candidates = [
      { note_id: 1, embedding: new Float32Array([1, 0, 0]) },
      { note_id: 2, embedding: new Float32Array([0, 1, 0]) },
    ]
    const result = mmr(query, candidates, 10)
    expect(result).toHaveLength(2)
    expect(result).toContain(1)
    expect(result).toContain(2)
  })

  it('selects exactly k candidates', () => {
    const query = new Float32Array([1, 0, 0])
    const candidates = [
      { note_id: 1, embedding: new Float32Array([1, 0, 0]) },
      { note_id: 2, embedding: new Float32Array([0, 1, 0]) },
      { note_id: 3, embedding: new Float32Array([0, 0, 1]) },
      { note_id: 4, embedding: new Float32Array([-1, 0, 0]) },
    ]
    const result = mmr(query, candidates, 2)
    expect(result).toHaveLength(2)
  })

  it('returns note_ids as numbers, not candidate objects', () => {
    const query = new Float32Array([1, 0])
    const candidates = [
      { note_id: 100, embedding: new Float32Array([1, 0]) },
      { note_id: 200, embedding: new Float32Array([0, 1]) },
    ]
    const result = mmr(query, candidates, 2)
    expect(result).toContain(100)
    expect(result).toContain(200)
    expect(result.every((id) => typeof id === 'number')).toBe(true)
  })

  it('picks the single candidate correctly', () => {
    const query = new Float32Array([1, 0])
    const result = mmr(query, [{ note_id: 42, embedding: new Float32Array([1, 0]) }], 5)
    expect(result).toEqual([42])
  })

  it('first pick is the most relevant with lambda=1 (pure relevance)', () => {
    // cosine similarities to query [1,0,0]:
    //   note 1 [1,0,0]   → 1.0 (identical)
    //   note 2 [0,1,0]   → 0.0 (orthogonal)
    //   note 3 [-1,0,0]  → -1.0 (opposite)
    const query = new Float32Array([1, 0, 0])
    const candidates = [
      { note_id: 1, embedding: new Float32Array([1, 0, 0]) },
      { note_id: 2, embedding: new Float32Array([0, 1, 0]) },
      { note_id: 3, embedding: new Float32Array([-1, 0, 0]) },
    ]
    const result = mmr(query, candidates, 1, 1.0)
    expect(result[0]).toBe(1)
  })

  it('promotes diversity over relevance with lambda=0', () => {
    // With lambda=0, score = -redundancy (similarity to already-selected).
    // First pick: all tied (no selected yet), so note 1 is picked first (highest index 0).
    // Second pick: note 2 is nearly identical to note 1 (high redundancy ≈ -0.99),
    //              note 3 is orthogonal to note 1 (redundancy = 0, score = 0).
    //              → note 3 wins.
    const query = new Float32Array([1, 0])
    const candidates = [
      { note_id: 1, embedding: new Float32Array([1, 0]) }, // most relevant
      { note_id: 2, embedding: new Float32Array([0.99, 0.14]) }, // very similar to note 1
      { note_id: 3, embedding: new Float32Array([0, 1]) }, // orthogonal to note 1
    ]
    const result = mmr(query, candidates, 2, 0.0)
    expect(result).toHaveLength(2)
    expect(result[1]).toBe(3)
  })
})
