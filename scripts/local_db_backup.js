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

async function backup() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '_');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  const backupPath = path.join(backupDir, `db_backup_${today}.sql`);
  const stream = fs.createWriteStream(backupPath);

  console.log(`🚀 Starting database backup to ${backupPath}...`);

  try {
    await client.connect();

    // Get list of tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tableRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables to backup.`);

    stream.write(`-- Database Local Backup --\n`);
    stream.write(`-- Date: ${new Date().toISOString()} --\n\n`);

    for (const table of tables) {
      console.log(`Backing up table: ${table}...`);
      stream.write(`-- Table data for: public.${table} --\n`);

      // Get columns
      const colRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      const columns = colRes.rows.map(c => c.column_name);

      // Get rows
      const rowRes = await client.query(`SELECT * FROM public."${table}";`);
      const rows = rowRes.rows;

      if (rows.length === 0) {
        stream.write(`-- No rows found for ${table}\n\n`);
        continue;
      }

      for (const row of rows) {
        const colNames = columns.map(c => `"${c}"`).join(', ');
        const valuesStr = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "''")}'`;
          }
          if (val instanceof Date) {
            return `'${val.toISOString()}'`;
          }
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          return val;
        }).join(', ');

        stream.write(`INSERT INTO public."${table}" (${colNames}) VALUES (${valuesStr});\n`);
      }
      stream.write('\n');
    }

    console.log(`✅ Backup completed successfully! Saved to backups/db_backup_${today}.sql`);
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
  } finally {
    stream.end();
    await client.end();
  }
}

backup();
