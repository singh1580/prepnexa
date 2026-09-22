import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentLibrary } from "@/features/materials/service";

export const metadata = { title: "My library" };

export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const materials = await getStudentLibrary(auth.user.id);
  return <WorkspaceShell admin={false} name={auth.user.name} permissions={auth.permissions} section="library">
    <header className="page-heading"><span className="eyebrow">MY LEARNING LIBRARY</span><h1>Study materials</h1><p>Your free and purchased PDFs, notes, videos and files in one protected place.</p></header>
    {materials.length ? <div className="student-material-grid">{materials.map((material) => <Link className="panel student-material-card" href={`/library/${material.id}`} key={material.id}><div><span className="eyebrow">{material.examName} · {material.type}</span><h2>{material.title}</h2><p>{material.originalFileName ?? (material.type === "ARTICLE" ? "Online article" : "Video lesson")}</p></div><div className="student-material-meta"><span>{material.accessSource === "FREE" ? "Free access" : "Purchased access"}</span><b>Open →</b></div></Link>)}</div> : <section className="panel empty-state"><div className="empty-symbol" aria-hidden="true">▤</div><h2>Your library is empty</h2><p>Free resources and materials included in your purchased packages will appear here.</p><Link className="button secondary" href="/packages">Explore packages</Link></section>}
  </WorkspaceShell>;
}
