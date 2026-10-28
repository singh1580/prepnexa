import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./tailwind.css";
import { AuthHistorySync } from "@/components/auth-history-sync";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/config/site";
export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: "Prepstore | Exam preparation packages and practice tests",
    template: "%s | Prepstore",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Prepstore | Exam preparation packages and practice tests",
    description: SITE_DESCRIPTION,
    locale: "en_IN",
    images: [
      {
        url: "/prepstore-icon-512.png",
        width: 512,
        height: 512,
        alt: "Prepstore",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Prepstore | Exam preparation packages and practice tests",
    description: SITE_DESCRIPTION,
    images: ["/prepstore-icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/prepstore-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-scroll-behavior="smooth"><body><AuthHistorySync/>{children}</body></html>}
