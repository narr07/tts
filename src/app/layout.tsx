import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teka Teki Silang - Generate Otomatis",
  description: "Aplikasi teka-teki silang (TTS) dengan generate kotak silang otomatis dari daftar soal. Admin input soal, pemain mengisi jawaban.",
  keywords: ["teka teki silang", "TTS", "crossword", "puzzle", "Next.js", "Indonesia"],
  authors: [{ name: "TTS App" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Teka Teki Silang",
    description: "Generate kotak silang otomatis dari soal yang diinput",
    siteName: "Teka Teki Silang",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Teka Teki Silang",
    description: "Generate kotak silang otomatis dari soal yang diinput",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
