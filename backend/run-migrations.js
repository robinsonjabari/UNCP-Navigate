// Script to run database migrations
require("dotenv").config()
const { Pool } = require("pg")
const fs = require("fs")
const path = require("path")

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true",
})

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log("Starting database migrations...\n")

    // Small helpers to make reruns safe
    const tableExists = async (tableName) => {
      const { rows } = await client.query(
        `SELECT to_regclass($1) IS NOT NULL AS exists`,
        [tableName]
      )
      return rows[0].exists === true
    }
    const hasSeedData = async () => {
      try {
        const { rows } = await client.query(
          `SELECT (SELECT COUNT(*)::int FROM places)    AS places,
                  (SELECT COUNT(*)::int FROM users)     AS users,
                  (SELECT COUNT(*)::int FROM emergency_info) AS emergency`
        )
        return (rows[0]?.places ?? 0) > 0 || (rows[0]?.users ?? 0) > 0
      } catch {
        // If tables don't exist yet, there can't be seed data
        return false
      }
    }

    // First, try to create the UUID extension (might fail if no permissions)
    try {
      console.log("Creating uuid-ossp extension...")
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
      console.log("Extension created successfully!\n")
    } catch (err) {
      console.log(
        "WARNING: Could not create extension (will skip it): " + err.message
      )
      console.log("Continuing with migrations...\n")
    }

    // 001 - schema creation (skip if core table already exists)
    const coreTable = "public.users"
    if (await tableExists(coreTable)) {
      console.log("Skipping 001_init.sql (schema already exists).\n")
    } else {
      console.log("Running 001_init.sql...")
      let sql001 = fs.readFileSync(
        path.join(__dirname, "src/db/migrations/001_init.sql"),
        "utf8"
      )
      sql001 = sql001.replace(
        /CREATE EXTENSION IF NOT EXISTS "uuid-ossp";?\n?/gi,
        ""
      )
      await client.query(sql001)
      console.log("001_init.sql completed successfully!\n")
    }

    // 002 - seed data (skip if there is already data)
    if (await hasSeedData()) {
      console.log("Skipping 002_seed.sql (seed data already present).\n")
    } else {
      console.log("Running 002_seed.sql...")
      let sql002 = fs.readFileSync(
        path.join(__dirname, "src/db/migrations/002_seed.sql"),
        "utf8"
      )
      await client.query(sql002)
      console.log("002_seed.sql completed successfully!\n")
    }

    console.log("All migrations completed successfully!\n")

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)

    console.log(`Created ${result.rows.length} tables:`)
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`)
    })
  } catch (error) {
    console.error("ERROR: Migration failed:", error.message)
    console.error(error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
