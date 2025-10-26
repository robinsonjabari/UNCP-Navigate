// Quick script to verify database connection and check if migrations are applied
require("dotenv").config()
const { Pool } = require("pg")

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true",
})

async function checkDatabase() {
  try {
    console.log("Checking database connection...\n")

    // Test connection
    const client = await pool.connect()
    console.log("Database connection successful!\n")

    // Check if tables exist
    console.log("Checking tables...\n")
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `

    const result = await client.query(tablesQuery)

    if (result.rows.length === 0) {
      console.log(" No tables found! Migrations have NOT been applied.\n")
      console.log("To apply migrations, run:")
      console.log(
        "  psql -h localhost -p 5432 -U uncp_navigate_user -d uncp_navigate -f src/db/migrations/001_init.sql"
      )
      console.log(
        "  psql -h localhost -p 5432 -U uncp_navigate_user -d uncp_navigate -f src/db/migrations/002_seed.sql"
      )
    } else {
      console.log(`Found ${result.rows.length} tables:\n`)
      result.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`)
      })

      // Check for some key tables
      const expectedTables = [
        "users",
        "places",
        "place_categories",
        "emergency_info",
        "feedback",
      ]
      const existingTables = result.rows.map((row) => row.table_name)
      const missingTables = expectedTables.filter(
        (table) => !existingTables.includes(table)
      )

      if (missingTables.length > 0) {
        console.log(
          `\n⚠️  Missing some expected tables: ${missingTables.join(", ")}`
        )
      } else {
        console.log("\n✅ All expected tables are present!")
      }

      // Check if data was seeded
      console.log("\n Checking seed data...\n")
      const placeCount = await client.query("SELECT COUNT(*) FROM places")
      const userCount = await client.query("SELECT COUNT(*) FROM users")
      const emergencyCount = await client.query(
        "SELECT COUNT(*) FROM emergency_info"
      )

      console.log(`   Places: ${placeCount.rows[0].count}`)
      console.log(`   Users: ${userCount.rows[0].count}`)
      console.log(`   Emergency Info: ${emergencyCount.rows[0].count}`)

      if (parseInt(placeCount.rows[0].count) > 0) {
        console.log("\n✅ Seed data has been loaded!")
      } else {
        console.log(
          "\n  No seed data found. Run 002_seed.sql to populate initial data."
        )
      }
    }

    client.release()
  } catch (error) {
    console.error(" Database check failed:", error.message)

    if (error.code === "ECONNREFUSED") {
      console.log("\n PostgreSQL server is not running or not accessible.")
      console.log(
        "   Make sure PostgreSQL is installed and running on port 5432."
      )
    } else if (error.code === "3D000") {
      console.log("\n Database does not exist.")
      console.log("   Create it with: createdb -U postgres uncp_navigate")
    } else if (error.code === "28P01") {
      console.log("\n Authentication failed. Check your .env credentials.")
    }
  } finally {
    await pool.end()
  }
}

checkDatabase()
