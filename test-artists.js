const { Pool } = require("pg"); const pool = new Pool({ connectionString: process.env.POSTGRES_URL || "postgresql://postgres:postgresajs@localhost:5432/postgres" }); async function main() { const client = await pool.connect(); try { console.log("Testing artists query"); const result = await client.query("SELECT * FROM artists WHERE label_id = $1", ["buildit-records"]); console.log(`Found ${result.rows.length} artists for buildit-records`); console.log(JSON.stringify(result.rows.slice(0, 2), null, 2)); } finally { client.release(); } } main().catch(console.error);
