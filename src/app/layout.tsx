import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  title: "타워 디펜스 | Pixel Art Edition",
  description: "25개 스테이지와 무한 모드를 제공하는 본격 웹 타워 디펜스 게임. 8종 타워, 24종 스킬, 무기 강화 시스템까지!",
  keywords: ["타워 디펜스", "tower defense", "전략 게임", "pixel art", "웹 게임", "무료 게임"],
  authors: [{ name: "jungm" }],
  openGraph: {
    title: "타워 디펜스 | Pixel Art Edition",
    description: "전략과 성장의 재미가 결합된 본격 웹 타워 디펜스 게임",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "타워 디펜스 | Pixel Art Edition",
    description: "전략과 성장의 재미가 결합된 본격 웹 타워 디펜스 게임",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
