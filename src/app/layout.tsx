import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./styles.css";
import { AuthHistorySync } from "@/components/auth-history-sync";
export const metadata: Metadata = {
  title: { default: "Prepstore", template: "%s | Prepstore" },
  description: "Placement exam practice tests and study material.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/prepstore-icon.svg", type: "image/svg+xml" },
      { url: "/prepstore-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/prepstore-icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/prepstore-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-scroll-behavior="smooth"><body><AuthHistorySync/>{children}</body></html>}
