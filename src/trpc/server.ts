import 'server-only'
import { createHydrationHelpers } from '@trpc/react-query/rsc'
import { initTRPC } from '@trpc/server'
import { cache } from 'react'
import superjson from 'superjson'
import { makeQueryClient } from './query-client'
import { appRouter } from './routers/_app'

const t = initTRPC.create({ transformer: superjson })
const createCaller = t.createCallerFactory(appRouter)

export const getQueryClient = cache(makeQueryClient)

const caller = createCaller({})

export const { trpc: serverTrpc, HydrateClient } = createHydrationHelpers<
  typeof appRouter
>(caller, getQueryClient)
