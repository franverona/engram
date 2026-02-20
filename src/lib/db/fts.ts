import type Database from 'better-sqlite3'

export function initFtsTable(db: Database.Database) {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS note_fts USING fts5(
      title,
      body,
      content=notes,
      content_rowid=id
    )
  `)
}

export function upsertFts(
  db: Database.Database,
  noteId: number,
  title: string,
  body: string,
) {
  db.transaction(() => {
    db.prepare('DELETE FROM note_fts WHERE rowid = ?').run(noteId)
    db.prepare('INSERT INTO note_fts (rowid, title, body) VALUES (?, ?, ?)').run(noteId, title, body)
  })()
}

type SearchFtsResult = {
  note_id: number
  rank: number
}
export function searchFts(
  db: Database.Database,
  query: string,
  limit = 5,
): SearchFtsResult[] {
  return db
    .prepare(
      `SELECT
        rowid AS note_id,
        rank
      FROM note_fts
      WHERE
        note_fts MATCH ?
      ORDER BY
        rank
      LIMIT ?`,
    )
    .all(query, limit) as SearchFtsResult[]
}

export function deleteFts(
  db: Database.Database,
  noteId: number,
  title: string,
  body: string,
) {
  db.prepare('INSERT INTO note_fts(note_fts, rowid, title, body) VALUES (\'delete\', ?, ?, ?)').run(noteId, title, body)
}
