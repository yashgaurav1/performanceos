import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shell/providers";
import "./globals.css";

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://osperformance.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PerformanceOS · AI Diet Coach & Photo Food Logging",
  description:
    "Log meals with a photo, get calorie targets that adapt to your real progress, and keep training, focus and spending in one private app.",
  applicationName: "PerformanceOS",
  authors: [{ name: "Yash Gaurav", url: "https://www.linkedin.com/in/yash-gaurav/" }],
  creator: "Yash Gaurav",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "PerformanceOS" },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PerformanceOS · AI Diet Coach & Photo Food Logging",
    description:
      "Log meals with a photo, get calorie targets that adapt to your real progress, and keep training, focus and spending in one private app.",
    url: siteUrl,
    siteName: "PerformanceOS",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${siteUrl}/og.jpg`,
        width: 1200,
        height: 630,
        alt: "PerformanceOS · AI Diet Coach & Photo Food Logging",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PerformanceOS · AI Diet Coach & Photo Food Logging",
    description:
      "Log meals with a photo, get calorie targets that adapt to your real progress, and keep training, focus and spending in one private app.",
    images: [`${siteUrl}/og.jpg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${satoshi.variable} ${inter.variable} dark`}>
      <head>
        {/* Android/Chrome fire beforeinstallprompt once, early. Catch it before React loads
            so any Install button on any page can use it (see src/lib/hooks/use-pwa-install.ts). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;window.dispatchEvent(new Event('cc:pwa-prompt'))});window.addEventListener('appinstalled',function(){window.__pwaPrompt=null;window.__pwaInstalled=true;window.dispatchEvent(new Event('cc:pwa-prompt'))});",
          }}
        />
      </head>
      <body className="min-h-dvh antialiased bg-[#0C0C0D] text-[#F5F5F4]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
