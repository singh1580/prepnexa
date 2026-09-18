import { Brand } from "@/components/brand";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell"><aside className="auth-story"><Brand /><div className="story-copy"><span className="eyebrow">A LITTLE FOCUS. EVERY DAY.</span><h1>Your next chapter<br />starts here.</h1><p>A dedicated space for your exam preparation.<br />One step forward, at your own pace.</p><div className="steps-art" aria-hidden="true"><i /><i /><i /><i /></div></div><p className="story-footer">Prepare today. Build tomorrow.</p></aside><main id="main-content" className="auth-main"><div className="mobile-brand"><Brand /></div><div className="auth-card">{children}</div><footer className="auth-footer">Your account. Your preparation. Your progress.</footer></main></div>;
}
