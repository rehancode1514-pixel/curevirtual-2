const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function checkTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Message' OR table_name = 'message';");
    console.log("Columns in Message table:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error("Error checking table:", err.message);
  } finally {
    await client.end();
  }
}

checkTable();
