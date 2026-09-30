import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors/app-error";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getMaterial } from "@/features/admin-catalog/service";
import {
  MaterialCreateForm,
  MaterialDeleteButton,
  MaterialUploadForm,
} from "@/features/admin-catalog/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspacePermission("material.manage");
  const parsed = catalogIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  let material: Awaited<ReturnType<typeof getMaterial>>;
  try {
    material = await getMaterial(parsed.data);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      permissions={auth.permissions}
      section="materials"
    >
      <Link href="/admin/materials">← Store & materials</Link>
      <header className="admin-page-header">
        <h1>{material.title}</h1>
        <p>
          {material.type} · Version {material.latestVersion?.version ?? 1}
        </p>
      </header>
      <section className="panel">
          {material.type === "PDF" || material.type === "FILE" ? (
            <>
              <div className="file-facts">
                <strong>
                  {material.latestVersion?.originalFileName ??
                    "No file uploaded"}
                </strong>
                <span>
                  {material.latestVersion?.sizeBytes
                    ? `${(material.latestVersion.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                    : "Upload required"}
                </span>
                <span>Version {material.latestVersion?.version ?? 0}</span>
              </div>
              {material.latestVersion?.privateObjectKey && <a className="button secondary" href={`/api/admin/catalog/materials/${material.id}/preview`} target="_blank" rel="noreferrer">Preview file</a>}
              <MaterialUploadForm material={material} />
            </>
          ) : (
            <MaterialCreateForm material={material} />
          )}
      </section>
      <MaterialDeleteButton id={material.id} />
    </WorkspaceShell>
  );
}
