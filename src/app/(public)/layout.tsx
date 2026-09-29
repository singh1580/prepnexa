import { PublicHeader } from "@/components/public-header";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="public-footer">
        <span>Prepstore</span>
        <span>Clear preparation. Secure progress.</span>
      </footer>
    </>
  );
}
