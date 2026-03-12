import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  summary: text('summary'),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => new Date().toISOString()),
  summarizedAt: text('summarized_at'),
})

export const chats = sqliteTable('chats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chatId: integer('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const noteTags = sqliteTable(
  'note_tags',
  {
    noteId: integer('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.tagId] })],
)
