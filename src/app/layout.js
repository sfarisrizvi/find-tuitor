import "./globals.css";
import AccessGate from "./AccessGate";

export const metadata = {
  title: "Find Tutors | Pakistan's Top Tutors",
  description: "Connecting students with Pakistan's best verified educators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AccessGate>
          {children}
        </AccessGate>
      </body>
    </html>
  );
}

