import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const siteTitle = "教師小幫手";
const siteDescription = '為親師溝通提供小幫手支援的回覆建議。';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-website-url.com"; // Fallback URL
const siteImage = `${siteUrl}/placeholder-social-image.jpg`; // Placeholder image path

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  icons: {
    icon: "/favicon.ico", // Assuming your favicon is at public/favicon.ico
  },
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
        alt: `${siteTitle} - ${siteDescription}`,
      },
    ],
    locale: 'zh_Hant',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [siteImage],
    // creator: '@yourTwitterHandle', // Optional: Add your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // manifest: "/site.webmanifest", // Optional: If you have a manifest file
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
        <footer className="py-8 text-center text-muted-foreground text-xs">
          <p>
            © 2025 桃園市石門國小資訊組{' '}
            <a
              href="https://www.smes.tyc.edu.tw/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              阿凱老師 設計
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
