
import { sql } from "drizzle-orm";
import { db } from "../db";

async function main() {
  console.log("Running migration: make authors optional in research_documents table");
  
  try {
    // Alter the table to make authors column nullable
    await db.execute(sql`
      ALTER TABLE research_documents ALTER COLUMN authors DROP NOT NULL
    `);
    
    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
