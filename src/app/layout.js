import "./globals.css";
import { AppHeader } from "../components/layout/AppHeader";
import { Footer } from "../components/layout/Footer";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL("https://tutoronline.pk"),
  title: "Find Tutor Online | Pakistan's Top Tutors",
  description: "Connecting students with Pakistan's best verified educators.",
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Find Tutor Online | Pakistan's Top Tutors",
    description: "Connecting students with Pakistan's best verified educators.",
    url: "https://tutoronline.pk",
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
        alt: "TutorOnline.pk - Pakistan's Top Tutors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Tutor Online | Pakistan's Top Tutors",
    description: "Connecting students with Pakistan's best verified educators.",
    images: ["https://tutoronline.pk/featured-image.jpg"],
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TutorOnline.pk",
    "url": "https://tutoronline.pk",
    "logo": "https://tutoronline.pk/featured-image.jpg",
    "description": "Connecting students with Pakistan's best verified educators.",
  };

  return (
    <html lang="en" prefix="og: http://ogp.me/ns#">
      <head>
        <meta property="og:site_name" content="TutorOnline.pk" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Find Tutor Online | Pakistan's Top Tutors" />
        <meta property="og:description" content="Connecting students with Pakistan's best verified educators." />
        <meta property="og:image" content="https://tutoronline.pk/featured-image.jpg" />
        <meta property="og:image:secure_url" content="https://tutoronline.pk/featured-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="TutorOnline.pk - Pakistan's Top Tutors" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find Tutor Online | Pakistan's Top Tutors" />
        <meta name="twitter:description" content="Connecting students with Pakistan's best verified educators." />
        <meta name="twitter:image" content="https://tutoronline.pk/featured-image.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <AppHeader />
        <main style={{ minHeight: 'calc(100vh - 64px - 300px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

