import 'server-only'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as sqliteVec from 'sqlite-vec'
import { initFtsTable } from './fts'
import * as schema from './schema'
import { initVecTable } from './vec'

const sqlite = new Database(process.env.DATABASE_PATH ?? './data/engram.db')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
sqliteVec.load(sqlite)

initVecTable(sqlite)
initFtsTable(sqlite)

export const db = drizzle(sqlite, { schema })
export { sqlite }
