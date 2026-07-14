import "./globals.css";
import { AppHeader } from "../components/layout/AppHeader";
import { Footer } from "../components/layout/Footer";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL("https://find-tuitor.com"),
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
    url: "https://find-tuitor.com",
    siteName: "Find Tuitor",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Find Tuitor Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Tutor Online | Pakistan's Top Tutors",
    description: "Connecting students with Pakistan's best verified educators.",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Find Tuitor",
    "url": "https://find-tuitor.com",
    "logo": "https://find-tuitor.com/favicon.png",
    "description": "Connecting students with Pakistan's best verified educators.",
  };

  return (
    <html lang="en">
      <head>
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

