import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  initVecTable,
  upsertEmbedding,
  searchEmbeddings,
  deleteEmbedding,
  getEmbeddingsByIds,
} from './vec'

const DIM = 768

function makeEmbedding(activeDim: number): Float32Array {
  const v = new Float32Array(DIM)
  v[activeDim] = 1
  return v
}

describe('vec', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    sqliteVec.load(db)
    initVecTable(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('upsertEmbedding / getEmbeddingsByIds', () => {
    it('stores and retrieves an embedding by id', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      const results = getEmbeddingsByIds(db, [1])
      expect(results).toHaveLength(1)
      expect(Number(results[0].note_id)).toBe(1)
    })

    it('replaces an existing embedding when upserting with the same id', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      upsertEmbedding(db, 1, makeEmbedding(1)) // overwrite
      const results = getEmbeddingsByIds(db, [1])
      expect(results).toHaveLength(1)
    })

    it('stores multiple embeddings independently', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      upsertEmbedding(db, 2, makeEmbedding(1))
      const results = getEmbeddingsByIds(db, [1, 2])
      expect(results).toHaveLength(2)
    })

    it('returns empty array when no ids are provided', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      expect(getEmbeddingsByIds(db, [])).toEqual([])
    })

    it('returns only the requested ids', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      upsertEmbedding(db, 2, makeEmbedding(1))
      upsertEmbedding(db, 3, makeEmbedding(2))
      const results = getEmbeddingsByIds(db, [1, 3])
      expect(results).toHaveLength(2)
      const ids = results.map((r) => Number(r.note_id))
      expect(ids).toContain(1)
      expect(ids).toContain(3)
      expect(ids).not.toContain(2)
    })
  })

  describe('deleteEmbedding', () => {
    it('removes the embedding for the given id', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      deleteEmbedding(db, 1)
      expect(getEmbeddingsByIds(db, [1])).toHaveLength(0)
    })

    it('is a no-op when the id does not exist', () => {
      expect(() => deleteEmbedding(db, 999)).not.toThrow()
    })
  })

  describe('searchEmbeddings', () => {
    it('returns empty array when table is empty', () => {
      const results = searchEmbeddings(db, makeEmbedding(0), 5)
      expect(results).toEqual([])
    })

    it('returns the closest vector first', () => {
      // embedding 1 is identical to the query; embedding 2 is orthogonal
      upsertEmbedding(db, 1, makeEmbedding(0))
      upsertEmbedding(db, 2, makeEmbedding(1))
      const results = searchEmbeddings(db, makeEmbedding(0), 2)
      expect(Number(results[0].note_id)).toBe(1)
    })

    it('results are ordered by ascending distance', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      upsertEmbedding(db, 2, makeEmbedding(1))
      const results = searchEmbeddings(db, makeEmbedding(0), 2)
      expect(results[0].distance).toBeLessThanOrEqual(results[1].distance)
    })

    it('respects the limit parameter', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      upsertEmbedding(db, 2, makeEmbedding(1))
      upsertEmbedding(db, 3, makeEmbedding(2))
      const results = searchEmbeddings(db, makeEmbedding(0), 2)
      expect(results).toHaveLength(2)
    })

    it('each result includes note_id and distance fields', () => {
      upsertEmbedding(db, 1, makeEmbedding(0))
      const results = searchEmbeddings(db, makeEmbedding(0), 5)
      expect(results[0]).toHaveProperty('note_id')
      expect(results[0]).toHaveProperty('distance')
    })
  })
})
