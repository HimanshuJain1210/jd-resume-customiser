import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailor — JD to Resume",
  description: "Tailor your resume to any job description. Truthful rewrite, match score, ATS-ready PDF.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="paper-bg">{children}</body>
    </html>
  );
}
