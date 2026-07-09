import "./globals.css";
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "TutorOnline | Pakistan's Top Tutors",
  description: "Connecting students with Pakistan's best verified educators.",
  icons: {
    icon: '/favicon.png',
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
      </body>
    </html>
  );
}

