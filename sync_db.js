const { Client } = require('pg');
require('dotenv').config();

async function sync() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL.replace(':6543', ':5432'), // ensure direct port
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("🚀 Connected to DB for manual sync...");

    // 1. Add values to AppointmentStatus enum (ignoring if they exist)
    try {
      await client.query("ALTER TYPE \"AppointmentStatus\" ADD VALUE 'PENDING_PAYMENT'");
      console.log("✅ Added PENDING_PAYMENT to enum.");
    } catch (e) {
      console.log("⚠️ PENDING_PAYMENT already exists or failed:", e.message);
    }

    try {
      await client.query("ALTER TYPE \"AppointmentStatus\" ADD VALUE 'PAYMENT_FAILED'");
      console.log("✅ Added PAYMENT_FAILED to enum.");
    } catch (e) {
      console.log("⚠️ PAYMENT_FAILED already exists or failed:", e.message);
    }

    // 2. Add stripeCustomerId to User table
    try {
      await client.query("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"stripeCustomerId\" TEXT");
      console.log("✅ Added stripeCustomerId to User table.");
    } catch (e) {
      console.log("⚠️ Failed to add stripeCustomerId:", e.message);
    }

    // 3. Create unique index
    try {
      await client.query("CREATE UNIQUE INDEX IF NOT EXISTS \"User_stripeCustomerId_key\" ON \"User\"(\"stripeCustomerId\")");
      console.log("✅ Created unique index for stripeCustomerId.");
    } catch (e) {
      console.log("⚠️ Index creation failed:", e.message);
    }

    console.log("✨ Manual DB sync complete.");
  } catch (err) {
    console.error("❌ SQL execution failed:", err);
  } finally {
    await client.end();
  }
}

sync();
