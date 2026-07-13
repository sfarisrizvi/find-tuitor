import { redirect } from 'next/navigation';

export default function ConfirmPage() {
  // If the user lands here from an email link, redirect them to the dashboard or onboarding
  redirect('/tutor/dashboard');
}
