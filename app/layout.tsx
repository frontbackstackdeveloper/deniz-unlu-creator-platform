import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./interface-polish.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Deniz Ünlü | Metin2 Yayın ve Video Arşivi",
    template: "%s | Deniz Ünlü",
  },
  description:
    "Deniz Ünlü'nün canlı yayınları, güncel Metin2 videoları, topluluk bağlantıları ve video arşivi.",
  icons: {
    icon: [
      {
        url: "/lotus-icon.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: "/lotus-icon.png",
  },
  openGraph: {
    title: "Deniz Ünlü | Metin2 Yayın ve Video Arşivi",
    description: "Yayın kaçarsa, arşiv burada.",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: "/og.png",
        width: 1672,
        height: 941,
        alt: "Deniz Ünlü — Metin2, yayın ve arşiv",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deniz Ünlü | Metin2 Yayın ve Video Arşivi",
    description: "Yayın kaçarsa, arşiv burada.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
