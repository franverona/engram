import { createTRPCRouter } from "../init";
import { notesRouter } from "./notes";
import { searchRouter } from "./search";

export const appRouter = createTRPCRouter({
  notes: notesRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
