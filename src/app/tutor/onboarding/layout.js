export const metadata = {
  title: "Tutor Onboarding | TutorOnline.pk",
  description: "Complete your tutor profile onboarding to get verified and start teaching online in Pakistan.",
  openGraph: {
    title: "Tutor Profile Onboarding | TutorOnline.pk",
    description: "Complete your tutor profile onboarding to get verified and start teaching online in Pakistan.",
    url: "https://tutoronline.pk/tutor/onboarding",
    siteName: "TutorOnline.pk",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "https://tutoronline.pk/featured-image.jpg",
        secureUrl: "https://tutoronline.pk/featured-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "TutorOnline.pk - Join as a Verified Educator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutor Profile Onboarding | TutorOnline.pk",
    description: "Complete your tutor profile onboarding to get verified and start teaching online in Pakistan.",
    images: ["https://tutoronline.pk/featured-image.jpg"],
  },
};

export default function TutorOnboardingLayout({ children }) {
  return children;
}
