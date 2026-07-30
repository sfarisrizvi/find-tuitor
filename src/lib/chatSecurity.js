// src/lib/chatSecurity.js
// Inspects message text to detect phone numbers, email addresses, or external URLs

const PHONE_REGEX = /(\+?92|0)?3\d{2}[-\s]?\d{7}\b|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b\d{10,13}\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const URL_REGEX = /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|org|net|edu|pk|gov|mil|biz|info|me|io|co|us|uk|ca)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;

export function inspectMessageSafety(text) {
  if (!text || typeof text !== 'string') {
    return { hasWarning: false, flagType: null };
  }

  const hasPhone = PHONE_REGEX.test(text);
  const hasEmail = EMAIL_REGEX.test(text);
  const hasUrl = URL_REGEX.test(text);

  if (hasPhone || hasEmail || hasUrl) {
    let flagType = 'contact_info';
    if (hasPhone) flagType = 'Phone Number';
    else if (hasEmail) flagType = 'Email Address';
    else if (hasUrl) flagType = 'External Link';

    return {
      hasWarning: true,
      flagType,
      warningText: `⚠️ Warning: Sharing contact information (${flagType}) in chat violates TutorOnline Terms of Service. Platform guarantees, verified tutor protections, and escrow services apply ONLY to in-app interactions.`
    };
  }

  return { hasWarning: false, flagType: null };
}
