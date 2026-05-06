import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FloatingAdButton } from '@/components/FloatingAdButton';

const siteTitle = "教師小幫手";
const siteDescription = "為親師溝通提供小幫手支援的回覆建議。";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cagoooo.github.io/Message";
const siteImage = `${siteUrl}/og-image.png`;
// 必須與 next.config.ts 的 basePath 同步（GitHub Pages 部署在 /Message/ 子路徑）
const basePath = process.env.NODE_ENV === "production" ? "/Message" : "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  keywords: [
    "教師",
    "教育",
    "家長溝通",
    "親師溝通",
    "AI 回覆",
    "小幫手",
    "Gemini",
    "桃園市石門國小",
  ],
  authors: [{ name: "阿凱老師", url: "https://www.smes.tyc.edu.tw/" }],
  creator: "阿凱老師",
  publisher: "桃園市石門國小資訊組",
  icons: { icon: `${basePath}/favicon.ico` },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: siteTitle,
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: `${siteTitle} — ${siteDescription}`,
      },
    ],
    locale: "zh_Hant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [siteImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`flex flex-col min-h-screen font-sans antialiased bg-background`}>
        {children}
        <Toaster />
        <FloatingAdButton />
        <footer className="border-t border-border/50 bg-gradient-to-b from-background to-secondary/20 dark:from-background dark:to-secondary/30 py-8 text-center text-sm font-semibold text-muted-foreground">
          <p>
            © 2025 桃園市石門國小資訊組{' '}
            <a
              href="https://www.smes.tyc.edu.tw/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary hover:text-accent hover:underline transition-colors duration-300 ease-in-out"
            >
              阿凱老師 設計
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
