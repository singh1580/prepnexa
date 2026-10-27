import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./tailwind.css";
import { AuthHistorySync } from "@/components/auth-history-sync";
export const metadata: Metadata = {
  title: { default: "Prepstore", template: "%s | Prepstore" },
  description: "Placement exam practice tests and study material.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/prepstore-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-scroll-behavior="smooth"><body><AuthHistorySync/>{children}</body></html>}
