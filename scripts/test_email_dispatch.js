const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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

const targetEmail = process.argv[2];
const specificTemplate = process.argv[3];

if (!targetEmail) {
  console.log('Usage: node scripts/test_email_dispatch.js <target_email> [template_name]');
  console.log('Example: node scripts/test_email_dispatch.js test@example.com kyc_approved');
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('Error: RESEND_API_KEY is missing in .env.local');
  process.exit(1);
}

const resend = new Resend(apiKey);

const sampleData = {
  kyc_approved: {
    title: 'Congratulations! Your Profile is Officially Verified 🎉',
    userName: 'Faris Rizvi',
    templateName: 'kyc_approved',
    from: 'TutorOnline Support <support@tutoronline.pk>',
    mergeData: {
      USER_NAME: 'Faris Rizvi',
      PROFILE_URL: 'https://tutoronline.pk/tutors/sample-id-123',
    },
  },
  kyc_rejected: {
    title: 'Action Required: Update Your Verification Documents ⚠️',
    userName: 'Faris Rizvi',
    templateName: 'kyc_rejected',
    from: 'TutorOnline Support <support@tutoronline.pk>',
    mergeData: {
      USER_NAME: 'Faris Rizvi',
      REASON: 'CNIC front image is blurry. Please upload a clear photo.',
      ONBOARDING_URL: 'https://tutoronline.pk/tutor/onboarding?step=kyc',
    },
  },
  onboarding_drip_24h: {
    title: 'Parents in Lahore are searching for tutors like you!',
    userName: 'Faris Rizvi',
    templateName: 'onboarding_drip_24h',
    from: 'TutorOnline <parhlo@tutoronline.pk>',
    mergeData: {
      USER_NAME: 'Faris Rizvi',
      CITY: 'Lahore',
      ONBOARDING_URL: 'https://tutoronline.pk/tutor/onboarding?step=profile',
    },
  },
  onboarding_drip_72h: {
    title: 'Get 3x Profile Views with the Verified Badge ⚡',
    userName: 'Faris Rizvi',
    templateName: 'onboarding_drip_72h',
    from: 'TutorOnline <parhlo@tutoronline.pk>',
    mergeData: {
      USER_NAME: 'Faris Rizvi',
      ONBOARDING_URL: 'https://tutoronline.pk/tutor/onboarding?step=verification',
    },
  },
  demo_requested: {
    title: 'New Demo Class Requested for O-Level Physics 🎓',
    userName: 'Faris Rizvi',
    templateName: 'demo_requested',
    from: 'TutorOnline <parhlo@tutoronline.pk>',
    mergeData: {
      USER_NAME: 'Faris Rizvi',
      SUBJECT: 'O-Level Physics',
      PARENT_NAME: 'Mrs. Ahmed',
      CITY: 'Karachi',
      ACTION_URL: 'https://tutoronline.pk/tutor/dashboard?request=demo_99',
    },
  },
  account_notice: {
    title: 'Important Notice Regarding Your TutorOnline Account 🔔',
    userName: 'Faris Rizvi',
    templateName: 'account_notice',
    from: 'TutorOnline Support <support@tutoronline.pk>',
    mergeData: {
      USER_NAME: 'Faris Rizvi',
      MESSAGE: 'Your profile has been temporarily unlisted pending phone verification.',
      ACTION_URL: 'https://tutoronline.pk/tutor/dashboard',
    },
  },
};

async function sendTestEmail(key) {
  const config = sampleData[key];
  if (!config) {
    console.error(`Unknown template key: ${key}`);
    return;
  }

  const templatePath = path.join(__dirname, '..', 'src', 'emails', `${config.templateName}.html`);
  if (!fs.existsSync(templatePath)) {
    console.error(`Template file missing: ${templatePath}`);
    return;
  }

  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  Object.keys(config.mergeData).forEach((k) => {
    const regex = new RegExp(`{{${k}}}`, 'g');
    htmlContent = htmlContent.replace(regex, config.mergeData[k]);
  });

  try {
    const result = await resend.emails.send({
      from: config.from,
      to: [targetEmail],
      subject: `[TEST] ${config.title}`,
      html: htmlContent,
    });
    console.log(`✅ Sent template [${config.templateName}] to ${targetEmail} (ID: ${result.data ? result.data.id : 'OK'})`);
  } catch (err) {
    console.error(`❌ Failed to send template [${config.templateName}]:`, err.message);
  }
}

async function run() {
  console.log(`\n🚀 Dispatching test emails to: ${targetEmail}`);
  if (specificTemplate) {
    await sendTestEmail(specificTemplate);
  } else {
    for (const key of Object.keys(sampleData)) {
      await sendTestEmail(key);
    }
  }
  console.log('\n✨ Test dispatch complete!');
}

run();
