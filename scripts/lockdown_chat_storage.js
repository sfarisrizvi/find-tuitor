// scripts/lockdown_chat_storage.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && !key.startsWith('#')) env[key.trim()] = val.join('=').trim();
  });
}

const connectionString = env['DATABASE_URL'] || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🔒 Locking down chat-media storage bucket & policies...');
  await client.connect();

  try {
    // 1. Make chat-media bucket private
    await client.query(`
      UPDATE storage.buckets 
      SET public = false 
      WHERE id = 'chat-media';
    `);
    console.log('✅ Updated storage.buckets: chat-media is now strictly private (public = false).');

    // 2. Drop the overly permissive public select policy
    await client.query(`
      DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
    `);
    console.log('✅ Dropped policy "Anyone can view chat media" from storage.objects.');

    // 3. Verify bucket status
    const { rows } = await client.query(`
      SELECT id, name, public 
      FROM storage.buckets 
      WHERE id IN ('chat-media', 'teacher-files', 'client-files', 'teacher-media');
    `);
    console.log('\n📋 Current storage bucket status:');
    rows.forEach(r => console.log(`  - Bucket: ${r.id.padEnd(16)} Public: ${r.public}`));

    console.log('\n✨ Storage lockdown completed successfully.');
  } catch (err) {
    console.error('❌ Storage lockdown failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
