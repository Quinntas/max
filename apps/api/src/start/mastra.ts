import { PostgresStore } from "@mastra/pg";
import { pool } from "./drizzle";
import { Memory } from "@mastra/memory";

export function createMastraMemory(id: string) {
  return new Memory({
    storage: new PostgresStore({
      id,
      pool,
    })
  })
}

export const agentStorage = createMastraMemory('agent-storage')
