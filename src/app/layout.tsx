import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "教師AI助理",
  description: '為親師溝通提供AI支援的回覆建議。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
