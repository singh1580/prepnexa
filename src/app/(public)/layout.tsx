import { PublicHeader } from "@/components/public-header";
export default function Layout({ children }: { children: React.ReactNode }) { return <><PublicHeader />{children}<footer className="public-footer"><span>PrepNexa is a temporary working name.</span><span>Clear preparation. Secure progress.</span></footer></>; }
