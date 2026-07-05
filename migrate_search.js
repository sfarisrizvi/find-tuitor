const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB via Pooler');
    
    const sql = fs.readFileSync('tutor_search_migration.sql', 'utf8');
    
    await client.query(sql);
    console.log('Migration executed successfully!');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
