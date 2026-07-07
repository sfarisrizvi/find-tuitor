const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qlhcavfyllfcwifxbtbu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGNhdmZ5bGxmY3dpZnhidGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjY3NiwiZXhwIjoyMDk4ODI4Njc2fQ.VVWW5Hka16m1ds-qLTXKEPJ-umS8Wv284a24uJHK4i0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const filesToMigrate = [
  'm.fahadsuleman@gmail.com/profile/1783330923358.png',
  'nafeesrizvi4@gmail.com/profile/1783428017223.jpg',
  'nafeesrizvi4@gmail.com/profile/1783428018170.png'
];

async function main() {
  console.log('Starting profile media migration...');

  for (const filePath of filesToMigrate) {
    console.log(`Downloading: ${filePath} from teacher-files...`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('teacher-files')
      .download(filePath);

    if (downloadError) {
      console.error(`Failed to download ${filePath}:`, downloadError.message);
      continue;
    }

    console.log(`Uploading: ${filePath} to teacher-media...`);
    const { error: uploadError } = await supabase.storage
      .from('teacher-media')
      .upload(filePath, fileData, {
        contentType: filePath.endsWith('.png') ? 'image/png' : 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`Failed to upload ${filePath} to teacher-media:`, uploadError.message);
    } else {
      console.log(`Successfully migrated ${filePath} to teacher-media!`);
    }
  }

  console.log('Migration finished.');
}

main();
