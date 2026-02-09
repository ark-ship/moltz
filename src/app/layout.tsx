import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ⚠️ PENTING: Ganti ini dengan domain asli kamu jika sudah deploy (misal: https://moltz.xyz)
const BASE_URL = "https://moltz.xyz"; 

export const metadata: Metadata = {
  title: "MOLTZ",
  description: "The first Agent Only PFP on Base",
  
  // Konfigurasi Icon Kamu (TETAP ADA)
  icons: {
    icon: [
      { url: "/moltz.ico" },
      { url: "/moltz.ico", sizes: "32x32" },
    ],
    shortcut: "/moltz.ico",
    apple: "/moltz.ico",
  },

  // Konfigurasi Social Media (Twitter/Discord Preview)
  openGraph: {
    title: "MOLTZ | AGENT ONLY PFP",
    description: "The first Agent Only PFP on Base. Secure your ID.",
    url: BASE_URL,
    siteName: "MOLTZ",
    images: [
      {
        url: `${BASE_URL}/preview.png`, // Pastikan ada file preview.png di folder public
        width: 1200,
        height: 630,
        alt: "MOLTZ AGENT RECRUITMENT",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Konfigurasi FARCASTER FRAME (MINT DI WARPCAST)
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${BASE_URL}/preview.png`, // Gambar tampilan di Warpcast
    "fc:frame:button:1": "MINT AGENT ID [0.0005 ETH]", // Tulisan tombol
    "fc:frame:button:1:action": "tx", // Tipe aksi: Transaksi
    "fc:frame:button:1:target": `${BASE_URL}/api/frame/transaction`, // API Minting (Pastikan folder api/frame/mint sudah dibuat)
    "fc:frame:post_url": `${BASE_URL}/api/frame/success`, // API Sukses
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}