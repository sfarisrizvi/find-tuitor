import { Resend } from 'resend';
import { createClient } from '../utils/supabase/client';
import fs from 'fs';
import path from 'path';

/**
 * Unified Dual-Channel Notification Dispatcher
 * Inserts in-app notification record and dispatches responsive HTML email via Resend SDK.
 */
export async function sendNotification({
  userId,
  userEmail,
  userName = 'Valued User',
  title,
  message,
  type = 'system',
  priority = 'INFO', // 'URGENT', 'ACTION REQUIRED', 'HIGH', 'INFO'
  actionUrl = null,
  templateName = null,
  templateData = {},
}) {
  try {
    const supabase = createClient();

    // 1. Insert In-App Notification into PostgreSQL
    const { error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        priority,
        action_url: actionUrl,
        read: false,
      });

    if (dbError) {
      console.error('Error inserting notification to DB:', dbError);
    }

    // 2. Dispatch HTML Email via Resend SDK if RESEND_API_KEY and userEmail are present
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && userEmail && templateName) {
      try {
        const resend = new Resend(resendApiKey);
        const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.html`);
        if (fs.existsSync(templatePath)) {
          let htmlContent = fs.readFileSync(templatePath, 'utf8');

          // Merge placeholders
          const fullActionUrl = actionUrl ? `https://tutoronline.pk${actionUrl}` : 'https://tutoronline.pk';
          const mergeData = {
            USER_NAME: userName,
            ACTION_URL: fullActionUrl,
            PROFILE_URL: templateData.PROFILE_URL || (userId ? `https://tutoronline.pk/tutors/${userId}` : fullActionUrl),
            ONBOARDING_URL: templateData.ONBOARDING_URL || 'https://tutoronline.pk/tutor/onboarding',
            TITLE: title,
            MESSAGE: message,
            ...templateData,
          };

          Object.keys(mergeData).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, mergeData[key] || '');
          });

          // Determine Sender Email based on template category
          const isSupportCategory = ['kyc_approved', 'kyc_rejected', 'account_notice'].includes(templateName);
          const defaultFrom = isSupportCategory
            ? 'TutorOnline Support <support@tutoronline.pk>'
            : 'TutorOnline <parhlo@tutoronline.pk>';
          const fromEmail = process.env.RESEND_FROM_EMAIL || defaultFrom;

          await resend.emails.send({
            from: fromEmail,
            to: [userEmail],
            subject: title,
            html: htmlContent,
          });
          console.log(`Successfully dispatched email [${templateName}] from ${fromEmail} to ${userEmail} via Resend`);
        }
      } catch (emailErr) {
        console.error('Error sending email notification via Resend:', emailErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('sendNotification exception:', err);
    return { success: false, error: err.message };
  }
}
