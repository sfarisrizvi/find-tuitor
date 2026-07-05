import "./globals.css";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

export const metadata = {
  title: "Find Tutors | Pakistan's Top Tutors",
  description: "Connecting students with Pakistan's best verified educators.",
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
