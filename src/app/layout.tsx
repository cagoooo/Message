import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FloatingAdButton } from '@/components/FloatingAdButton';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/InstallPrompt';
import { AdminAccessButton } from '@/components/AdminAccessButton';

const siteTitle = "教師回覆小幫手 Pro版";
const siteDescription = "為親師溝通提供同理心 AI 回覆建議，含 12 種情境、語氣與長度自訂、PWA 離線、OCR 識圖。";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cagoooo.github.io/Message";
// 必須與 next.config.ts 的 basePath 同步（GitHub Pages 部署在 /Message/ 子路徑）
const basePath = process.env.NODE_ENV === "production" ? "/Message" : "";
// 每次 build 變動的 hash，用來 cache-bust og:image / icon URL，
// 避免 LINE / FB 永遠顯示舊圖。
const buildId = (process.env.NEXT_PUBLIC_BUILD_VERSION || Date.now().toString(36)).slice(0, 10);
const siteImage = `${siteUrl}/og-image.png?v=${buildId}`;

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
  manifest: `${basePath}/manifest.json`,
  applicationName: siteTitle,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteTitle,
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "any" },
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: { url: `${basePath}/apple-touch-icon.png`, sizes: "180x180" },
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

export const viewport: Viewport = {
  themeColor: "#6b4ed4", // Direction A 主色
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

// JSON-LD 結構化資料 — 讓 Google / Bing 能正確分類這是免費教育類 Web App
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteTitle,
  alternateName: "教師回應訊息建議小幫手",
  description: siteDescription,
  url: siteUrl,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  inLanguage: "zh-Hant",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  creator: {
    "@type": "Person",
    name: "阿凱老師",
    affiliation: {
      "@type": "EducationalOrganization",
      name: "桃園市石門國小資訊組",
      url: "https://www.smes.tyc.edu.tw/",
    },
  },
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "teacher",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          // 安全：jsonLd 是上面靜態定義的常數，沒有外來輸入
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`flex flex-col min-h-screen font-sans antialiased bg-background`}>
        {children}
        <Toaster />
        <FloatingAdButton />
        <ServiceWorkerRegister />
        <InstallPrompt />
        <AdminAccessButton />
        <footer className="relative mt-12 sm:mt-16">
          {/* Direction A 配色 footer：dashed 頂線 + 漸層底 + 雙色點裝飾 + 副標 */}
          <div className="absolute inset-x-0 top-0 h-px bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0_8px,transparent_8px_16px)]" />
          <div className="bg-gradient-to-b from-transparent via-secondary/30 to-secondary/60 dark:via-secondary/20 dark:to-secondary/30 backdrop-blur-sm">
            <div className="mx-auto max-w-5xl px-6 py-8 sm:py-10 text-center">
              {/* 主品牌行：心形 + 學校 + 老師 */}
              <p className="inline-flex items-center justify-center flex-wrap gap-x-1.5 gap-y-1 text-sm font-medium text-muted-foreground">
                <span className="text-muted-foreground/80">© {new Date().getFullYear()}</span>
                <span aria-hidden className="inline-block w-1 h-1 rounded-full bg-primary/50 mx-1" />
                <span>桃園市石門國小資訊組</span>
                <span aria-hidden className="inline-block w-1 h-1 rounded-full bg-accent/60 mx-1" />
                <a
                  href="https://www.smes.tyc.edu.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:underline underline-offset-4 decoration-2 decoration-primary/60 transition-all"
                >
                  阿凱老師
                  <span className="text-accent text-base group-hover:scale-110 transition-transform" aria-hidden>♥</span>
                  <span className="text-foreground/60 font-medium">設計</span>
                </a>
              </p>
              {/* 副標：價值主張 */}
              <p className="mt-3 text-xs text-muted-foreground/70 tracking-wider">
                親師溝通 · 同理回應 · 教學專業
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
