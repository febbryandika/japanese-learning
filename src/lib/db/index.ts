import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'

import * as schema from './schema'

// Neon's serverless driver talks over WebSockets; in the Node.js server runtime
// we must supply a WebSocket implementation. The Pool (vs. neon-http) is used so
// transactions are available for later phases (e.g. exam scoring).
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })

export const db = drizzle(pool, { schema })
