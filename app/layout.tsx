import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// Press Start 2P — chunky 8-bit headings/score. VT323 — readable pixel body text.
const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});
const term = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-term",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Word Hunt — Daily Puzzle",
  description:
    "A new letter grid every day. Swipe to find as many words as you can in 80 seconds. Same board for everyone — share your score.",
  openGraph: {
    title: "Word Hunt — Daily Puzzle",
    description:
      "Swipe to find words in 80 seconds. Same board for everyone, every day.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5c94fc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pixel.variable} ${term.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
