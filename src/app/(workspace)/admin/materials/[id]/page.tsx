import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors/app-error";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getMaterial, getCatalogExams } from "@/features/admin-catalog/service";
import { MaterialCreateForm, MaterialPublishButton, CatalogActions } from "@/features/admin-catalog/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspacePermission("material.manage");
  const parsed = catalogIdSchema.safeParse((await params).id); if (!parsed.success) notFound();
  let material: Awaited<ReturnType<typeof getMaterial>>;
  try { material = await getMaterial(parsed.data); }
  catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  const exams = material.status === "DRAFT" ? await getCatalogExams() : [];
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="packages">
    <Link href="/admin/packages">← Packages and materials</Link>
    <header className="page-heading"><h1>{material.title}</h1><p>{material.type} · {material.status}</p></header>
    {material.status === "DRAFT" ? <section className="panel"><MaterialCreateForm material={material} exams={exams} /><MaterialPublishButton id={material.id} /></section> : <section className="panel"><p style={{ whiteSpace: "pre-wrap" }}>{material.body}</p></section>}
    <CatalogActions id={material.id} kind="materials" status={material.status} />
  </WorkspaceShell>;
}
