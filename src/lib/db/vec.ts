import type Database from 'better-sqlite3'

const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIMENSION ?? '768', 10)

export function initVecTable(db: Database.Database) {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings USING vec0(
      note_id INTEGER PRIMARY KEY,
      embedding float[${EMBEDDING_DIM}]
    )
  `)
}

export function upsertEmbedding(
  db: Database.Database,
  noteId: number,
  embedding: Float32Array,
) {
  const buf = Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength)
  db.transaction(() => {
    db.prepare('DELETE FROM note_embeddings WHERE note_id = ?').run(BigInt(noteId))
    db.prepare('INSERT INTO note_embeddings (note_id, embedding) VALUES (?, ?)').run(BigInt(noteId), buf)
  })()
}

export function searchEmbeddings(
  db: Database.Database,
  queryEmbedding: Float32Array,
  limit = 5,
): { note_id: number, distance: number }[] {
  return db
    .prepare(
      `SELECT note_id, distance
       FROM note_embeddings
       WHERE embedding MATCH ?
       ORDER BY distance
       LIMIT ?`,
    )
    .all(Buffer.from(queryEmbedding.buffer), limit) as {
    note_id: number
    distance: number
  }[]
}

export function deleteEmbedding(db: Database.Database, noteId: number) {
  db.prepare('DELETE FROM note_embeddings WHERE note_id = ?').run(BigInt(noteId))
}

export function getEmbeddingsByIds(
  db: Database.Database,
  noteIds: number[],
): { note_id: number, embedding: Buffer }[] {
  if (noteIds.length === 0) {
    return []
  }

  const placeholders = noteIds.map(() => '?').join(', ')
  return db
    .prepare(`SELECT note_id, embedding FROM note_embeddings WHERE note_id IN (${placeholders})`)
    .all(...noteIds.map((id) => BigInt(id))) as { note_id: number, embedding: Buffer }[]
}
