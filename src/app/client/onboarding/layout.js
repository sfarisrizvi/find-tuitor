export const metadata = {
  title: "Client Onboarding | TutorOnline.pk",
  description: "Find and hire Pakistan's top verified tutors online.",
  openGraph: {
    title: "Client Onboarding | TutorOnline.pk",
    description: "Find and hire Pakistan's top verified tutors online.",
    url: "https://tutoronline.pk/client/onboarding",
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
        alt: "TutorOnline.pk - Find Top Tutors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Client Onboarding | TutorOnline.pk",
    description: "Find and hire Pakistan's top verified tutors online.",
    images: ["https://tutoronline.pk/featured-image.jpg"],
  },
};

export default function ClientOnboardingLayout({ children }) {
  return children;
}
