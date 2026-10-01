import { Brand } from "@/components/brand";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell"><aside className="auth-story"><Brand /><div className="story-copy"><span className="eyebrow">PREPARATION, REFINED</span><h1>Turn effort into<br />measurable progress.</h1><p>Focused tests, organised material and meaningful analysis in one calm learning workspace.</p><div className="auth-orbit" aria-hidden="true"><i /><i /><i /></div></div><p className="story-footer">PREPSTORE · LEARN WITH INTENT</p></aside><main id="main-content" className="auth-main"><div className="mobile-brand"><Brand /></div><div className="auth-card">{children}</div><footer className="auth-footer">Secure access to your Prepstore workspace.</footer></main></div>;
}
