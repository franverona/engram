import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tags } from '@/lib/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const tagsRouter = createTRPCRouter({
  list: baseProcedure.query(async () => {
    return db.select().from(tags).orderBy(asc(tags.name))
  }),
})
