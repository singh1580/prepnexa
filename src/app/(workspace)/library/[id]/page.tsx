import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentMaterial } from "@/features/materials/service";
import { AppError } from "@/lib/errors/app-error";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  let material: Awaited<ReturnType<typeof getStudentMaterial>>;
  try { material = await getStudentMaterial(parsed.data, auth.user.id); }
  catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  return <WorkspaceShell admin={false} name={auth.user.name} permissions={auth.permissions} section="library">
    <Link className="back-link" href="/dashboard/library">← My library</Link>
    <header className="page-heading material-heading"><span className="eyebrow">{material.examName} · {material.type}</span><h1>{material.title}</h1><p>Version {material.version} · {material.accessSource === "FREE" ? "Free access" : "Included in your purchased package"}</p></header>
    {material.type === "ARTICLE" ? <article className="panel material-article">{material.body}</article> : material.type === "VIDEO" ? <section className="panel"><h2>Video lesson</h2><p>This lesson opens on its secure HTTPS source.</p><a className="button" href={material.body ?? "#"} target="_blank" rel="noreferrer">Open video</a></section> : <section className="material-reader"><div className="panel material-reader-toolbar"><div><strong>{material.originalFileName}</strong><small>{material.sizeBytes ? `${(material.sizeBytes / 1024 / 1024).toFixed(2)} MB` : "Protected file"}</small></div>{material.allowDownload ? <a className="button secondary" href={`/api/materials/${material.id}/access?action=download`}>Download protected copy</a> : <span className="quiet-tag">Online viewing only</span>}</div>{material.contentType === "application/pdf" ? <iframe title={material.title} src={`/api/materials/${material.id}/access?action=view`} className="pdf-reader" /> : material.allowDownload ? <section className="panel empty-state"><h2>Ready to download</h2><p>This file type is delivered as a protected download after every access check.</p><a className="button" href={`/api/materials/${material.id}/access?action=download`}>Download file</a></section> : <section className="panel empty-state"><h2>Download disabled</h2><p>This resource is currently available for online PDF reading only.</p></section>}</section>}
  </WorkspaceShell>;
}
