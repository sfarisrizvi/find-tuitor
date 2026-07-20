import "./globals.css";
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import Script from "next/script";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        url: "/featured-image.jpg",
        width: 1200,
        height: 630,
        alt: "TutorOnline.pk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Tutor Online | Pakistan's Top Tutors",
    description: "Connecting students with Pakistan's best verified educators.",
    images: ["/featured-image.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 64px - 300px)' }}>
          {children}
        </main>
        <Footer />
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}

