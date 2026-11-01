import type { Metadata } from "next";
import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Resilient offline fonts with system font fallbacks
const manrope = { variable: "font-manrope" };
const inter = { variable: "font-inter" };
const ibmPlexMono = { variable: "font-ibm-plex-mono" };

export const metadata: Metadata = {
  title: "Nexum - Bilateral Digital Work Infrastructure",
  description:
    "AI-mediated freelance marketplace. Turning vague briefs into immutable PRDs, structured milestone negotiation, and evidence-backed payments.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-canvas text-ink selection:bg-cobalt/15 selection:text-cobalt font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
