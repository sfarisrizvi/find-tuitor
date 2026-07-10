import "./globals.css";
import AccessGate from "./AccessGate";
import Script from "next/script";

export const metadata = {
  title: "TutorOnline | Pakistan's Top Tutors",
  description: "Connecting students with Pakistan's best verified educators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AccessGate>
          {children}
        </AccessGate>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}

