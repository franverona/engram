import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initFtsTable, upsertFts, searchFts, deleteFts } from './fts'

describe('fts', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    initFtsTable(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('upsertFts', () => {
    it('inserts a note that can be found via search', () => {
      upsertFts(db, 1, 'useEffect cleanup', 'Return a cleanup function to avoid memory leaks')
      const results = searchFts(db, 'useEffect')
      expect(results).toHaveLength(1)
      expect(results[0].note_id).toBe(1)
    })

    it('replaces the previous entry when upserting with the same id', () => {
      upsertFts(db, 1, 'original title', 'original body')
      upsertFts(db, 1, 'updated title', 'updated body')
      expect(searchFts(db, 'original')).toHaveLength(0)
      expect(searchFts(db, 'updated')).toHaveLength(1)
    })

    it('stores multiple notes independently', () => {
      upsertFts(db, 1, 'React hooks', 'Using useEffect and useState')
      upsertFts(db, 2, 'SQLite FTS5', 'Full text search with virtual tables')
      expect(searchFts(db, 'React')).toHaveLength(1)
      expect(searchFts(db, 'SQLite')).toHaveLength(1)
    })
  })

  describe('searchFts', () => {
    it('returns empty array when table is empty', () => {
      expect(searchFts(db, 'anything')).toEqual([])
    })

    it('returns empty array when no note matches the query', () => {
      upsertFts(db, 1, 'React hooks', 'useState and useEffect')
      expect(searchFts(db, 'SQLite')).toEqual([])
    })

    it('each result includes note_id and rank fields', () => {
      upsertFts(db, 1, 'hello world', 'some body text')
      const results = searchFts(db, 'hello')
      expect(results[0]).toHaveProperty('note_id')
      expect(results[0]).toHaveProperty('rank')
    })

    it('rank values are negative (more negative = better match)', () => {
      upsertFts(db, 1, 'hello world', 'some body text')
      const results = searchFts(db, 'hello')
      expect(results[0].rank).toBeLessThan(0)
    })

    it('results are ordered best match first (ascending rank)', () => {
      upsertFts(db, 1, 'hello', 'hello hello hello')
      upsertFts(db, 2, 'hello', 'unrelated content here')
      const results = searchFts(db, 'hello')
      expect(results[0].rank).toBeLessThanOrEqual(results[1].rank)
    })

    it('respects the limit parameter', () => {
      upsertFts(db, 1, 'hello world', 'body one')
      upsertFts(db, 2, 'hello there', 'body two')
      upsertFts(db, 3, 'hello again', 'body three')
      expect(searchFts(db, 'hello', 2)).toHaveLength(2)
    })

    it('matches terms in the body as well as the title', () => {
      upsertFts(db, 1, 'some title', 'the body mentions useEffect')
      const results = searchFts(db, 'useEffect')
      expect(results).toHaveLength(1)
      expect(results[0].note_id).toBe(1)
    })
  })

  describe('deleteFts', () => {
    it('removes the entry so it no longer appears in search', () => {
      upsertFts(db, 1, 'hello world', 'some body')
      deleteFts(db, 1)
      expect(searchFts(db, 'hello')).toHaveLength(0)
    })

    it('is a no-op when the id does not exist', () => {
      expect(() => deleteFts(db, 999)).not.toThrow()
    })

    it('only removes the targeted note, not others', () => {
      upsertFts(db, 1, 'hello world', 'body one')
      upsertFts(db, 2, 'hello there', 'body two')
      deleteFts(db, 1)
      const results = searchFts(db, 'hello')
      expect(results).toHaveLength(1)
      expect(results[0].note_id).toBe(2)
    })
  })
})
