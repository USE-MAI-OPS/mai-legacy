import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/posthog-provider";
import { PostHogPageView } from "@/components/posthog-pageview";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://maibot.ai";
const defaultTitle = "MAI Bot — The Thought & Context Data Company";
const defaultDescription =
  "MAI Bot stores thoughts and context — not just records or files — so Griot can answer from your private knowledge layer.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | MAI Bot",
  },
  description: defaultDescription,
  openGraph: {
    type: "website",
    siteName: "MAI Bot",
    title: defaultTitle,
    description: defaultDescription,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        <PostHogProvider>
          <PostHogPageView />
          {children}
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
