const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
});

const DATABASE_URL = env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '01_secure_roles_and_indexes.sql');
const MIGRATION_SQL = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  console.log('\n🚀 Running secure roles and indexes database migration...\n');
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    await client.query(MIGRATION_SQL);
    console.log('✅ Migration queries executed successfully!\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
