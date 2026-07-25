const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

const apiKey = process.env.RESEND_FULL_ACCESS_KEY || process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error('Error: RESEND_FULL_ACCESS_KEY is required.');
  process.exit(1);
}

async function listAndDeleteDrafts() {
  console.log('Fetching templates from Resend API...');
  try {
    const res = await fetch('https://api.resend.com/templates', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    console.log('GET /templates response:', JSON.stringify(data, null, 2));

    const list = data.data || data || [];
    if (!Array.isArray(list)) {
      console.log('No list array found in response.');
      return;
    }

    // Group templates by name
    const grouped = {};
    for (const t of list) {
      const name = t.name || t.id;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(t);
    }

    console.log(`Found ${list.length} total templates across ${Object.keys(grouped).length} names.`);

    for (const name of Object.keys(grouped)) {
      const items = grouped[name];
      // Keep the newest template (highest created_at or first item)
      const [newest, ...duplicates] = items;
      console.log(`\n📌 Template: [${name}] - Keeping ID: ${newest.id}`);

      // Try to publish newest if publish endpoint exists
      try {
        const pubRes = await fetch(`https://api.resend.com/templates/${newest.id}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (pubRes.status === 200 || pubRes.status === 201) {
          console.log(`  ✅ Published template [${name}] (${newest.id})`);
        }
      } catch (err) {
        // Publish endpoint might not be required
      }

      // Delete older duplicates/drafts
      for (const dup of duplicates) {
        console.log(`  🗑️ Deleting duplicate/draft ID: ${dup.id}...`);
        const delRes = await fetch(`https://api.resend.com/templates/${dup.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        if (delRes.status === 200 || delRes.status === 204) {
          console.log(`  ✅ Deleted draft ID: ${dup.id}`);
        } else {
          console.warn(`  ⚠️ Delete ID ${dup.id} status: ${delRes.status}`, await delRes.text());
        }
      }
    }

    console.log('\n✨ Cleanup completed!');
  } catch (err) {
    console.error('Cleanup exception:', err);
  }
}

listAndDeleteDrafts();
