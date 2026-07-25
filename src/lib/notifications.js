import { createClient } from '../utils/supabase/client';
import fs from 'fs';
import path from 'path';

/**
 * Unified Dual-Channel Notification Dispatcher
 * Inserts in-app notification record and optionally dispatches responsive HTML email via Resend.
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

    // 2. Dispatch HTML Email via Resend if RESEND_API_KEY and userEmail are present
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && userEmail && templateName) {
      try {
        const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.html`);
        if (fs.existsSync(templatePath)) {
          let htmlContent = fs.readFileSync(templatePath, 'utf8');

          // Merge placeholders
          const mergeData = {
            USER_NAME: userName,
            ACTION_URL: actionUrl ? `https://tutoronline.pk${actionUrl}` : 'https://tutoronline.pk',
            TITLE: title,
            MESSAGE: message,
            ...templateData,
          };

          Object.keys(mergeData).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, mergeData[key] || '');
          });

          // Dispatch email via Resend HTTP API
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'TutorOnline <notifications@tutoronline.pk>',
              to: [userEmail],
              subject: title,
              html: htmlContent,
            }),
          });
          console.log(`Successfully dispatched email [${templateName}] to ${userEmail}`);
        }
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('sendNotification exception:', err);
    return { success: false, error: err.message };
  }
}
