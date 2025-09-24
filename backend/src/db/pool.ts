import { Pool, PoolConfig } from "pg"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Database configuration
const config: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "uncp_navigate",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to try connecting before timing out
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
}

// Create the pool
const pool = new Pool(config)

// Handle pool errors
pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client:", err)
  process.exit(-1)
})

// Handle pool connection
pool.on("connect", (_client) => {
  console.log("New database client connected")
})

// Handle pool removal
pool.on("remove", (_client) => {
  console.log("Database client removed")
})

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT NOW()")
    client.release()

    console.log("✅ Database connection successful")
    console.log(`🕐 Database time: ${result.rows[0].now}`)
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

/**
 * Execute a query with automatic client management
 */
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    if (process.env.NODE_ENV === "development") {
      console.log("Executed query:", {
        text: text.replace(/\s+/g, " ").trim(),
        duration: `${duration}ms`,
        rows: result.rowCount,
      })
    }

    return result
  } catch (error) {
    console.error("❌ Query execution failed:", {
      text: text.replace(/\s+/g, " ").trim(),
      error: error instanceof Error ? error.message : error,
    })
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export const getClient = async () => {
  return await pool.connect()
}

/**
 * Execute multiple queries in a transaction
 */
export const transaction = async (
  queries: Array<{ text: string; params?: any[] }>
): Promise<any[]> => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const results = []
    for (const queryObj of queries) {
      const result = await client.query(queryObj.text, queryObj.params)
      results.push(result)
    }

    await client.query("COMMIT")
    console.log("✅ Transaction committed successfully")
    return results
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("❌ Transaction rolled back:", error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close all connections in the pool
 */
export const closePool = async (): Promise<void> => {
  try {
    await pool.end()
    console.log("Database pool closed")
  } catch (error) {
    console.error("❌ Error closing database pool:", error)
  }
}

/**
 * Get pool status information
 */
export const getPoolStatus = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}

// Export the pool instance for direct use if needed
export default pool
