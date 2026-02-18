import 'server-only'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as sqliteVec from 'sqlite-vec'
import * as schema from './schema'
import { initVecTable } from './vec'

const sqlite = new Database(process.env.DATABASE_PATH ?? './data/engram.db')
sqlite.pragma('journal_mode = WAL')
sqliteVec.load(sqlite)

initVecTable(sqlite)

export const db = drizzle(sqlite, { schema })
export { sqlite }
