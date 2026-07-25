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

const customApiKey = process.argv[2];
const resendApiKey = customApiKey || process.env.RESEND_FULL_ACCESS_KEY || process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('Error: Please provide a Full Access Resend API key.');
  process.exit(1);
}

const templatesToPush = [
  { name: 'welcome-tutor', file: 'welcome_tutor.html' },
  { name: 'welcome-client', file: 'welcome_client.html' },
  { name: 'verified-profile', file: 'verified_profile.html' },
  { name: 'kyc-approved', file: 'kyc_approved.html' },
  { name: 'kyc-rejected', file: 'kyc_rejected.html' },
  { name: 'onboarding-drip-24hrs', file: 'onboarding_drip_24h.html' },
  { name: 'drip-72hrs', file: 'onboarding_drip_72h.html' },
  { name: 'account-notice', file: 'account_notice.html' },
  { name: 'demo-requested', file: 'demo_requested.html' },
];

async function pushAll() {
  console.log(`\n🚀 Pushing templates to Resend Dashboard via API using key: ${resendApiKey.substring(0, 7)}...`);
  
  for (const item of templatesToPush) {
    const filePath = path.join(__dirname, '..', 'src', 'emails', item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${item.file}`);
      continue;
    }

    let htmlContent = fs.readFileSync(filePath, 'utf8');
    // Format variables as {{{VARIABLE_NAME}}} as required by Resend Templates API
    htmlContent = htmlContent.replace(/{{([^{}]+)}}/g, '{{{$1}}}');

    // Extract variables used in html content
    const varMatches = htmlContent.match(/{{{([^{}]+)}}}/g) || [];
    const varKeys = [...new Set(varMatches.map(m => m.replace(/[{}]/g, '')))];

    const variables = varKeys.map(key => {
      let fallback = 'TutorOnline';
      if (key === 'USER_NAME') fallback = 'Valued Member';
      else if (key === 'USER_AVATAR') fallback = 'https://tutoronline.pk/verified-user.svg';
      else if (key === 'PROFILE_URL') fallback = 'https://tutoronline.pk';
      else if (key === 'ONBOARDING_URL') fallback = 'https://tutoronline.pk/tutor/onboarding';
      else if (key === 'ACTION_URL') fallback = 'https://tutoronline.pk';
      else if (key === 'REASON') fallback = 'Document update required';
      else if (key === 'SUBJECT') fallback = 'Tuition Request';
      else if (key === 'PARENT_NAME') fallback = 'Parent';
      else if (key === 'CITY') fallback = 'Lahore';
      else if (key === 'MESSAGE') fallback = 'Important account notice';

      return {
        key: key,
        type: 'string',
        fallback_value: fallback
      };
    });

    try {
      const res = await fetch('https://api.resend.com/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          html: htmlContent,
          variables: variables,
        }),
      });

      const responseData = await res.json();
      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Template [${item.name}] created successfully! (ID: ${responseData.id || 'OK'})`);
      } else if (responseData.message && responseData.message.includes('already exists')) {
        console.log(`ℹ️ Template [${item.name}] already exists on Resend.`);
      } else {
        console.error(`❌ Failed to push [${item.name}] (Status ${res.status}):`, responseData.message || responseData);
      }
    } catch (err) {
      console.error(`❌ Error pushing [${item.name}]:`, err.message);
    }
  }

  console.log('\n✨ Push attempt completed!');
}

pushAll();
