import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from project root
const envPath = path.join(__dirname, "../../../../../.env");
if (fs.existsSync(envPath)) {
  console.log("Loading .env from:", envPath);
  dotenv.config({ path: envPath });
}

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log("Error: DATABASE_URL environment variable not set");
    process.exit(1);
  }

  console.log("✅ Connecting to database...");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Connected successfully\n");

    // Get all .sql files and sort them
    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration file(s)\n`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(__dirname, file);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      try {
        await pool.query(sql);
        console.log(`✅ ${file} completed successfully\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.code === "42P07" ||
          error.message.includes("already exists")
        ) {
          console.log(`${file} - table already exist, skipping\n`);
        } else {
          throw error;
        }
      }
    }

    // Verify tables
    const result = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    `);

    console.log("Tables in database:");
    result.rows.forEach((row) => {
      console.log(`\t${row.table_name}`);
    });
  } catch (error) {
    console.log("Migrations failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.log("Unexpected error:", error);
  process.exit(1);
});
