import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./styles.css";
export const metadata: Metadata = { title:{default:"Prepstore",template:"%s | Prepstore"},description:"Placement exam practice tests and study material." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-scroll-behavior="smooth"><body>{children}</body></html>}
