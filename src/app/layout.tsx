import type { Metadata } from "next";
import "./styles.css";
export const metadata: Metadata = { title:{default:"Prepstore",template:"%s | Prepstore"},description:"Placement exam practice tests and study material." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>}
