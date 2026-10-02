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
      <Link className="back-link" href="/admin/materials">← Store &amp; materials</Link>
      <header className="admin-page-header reference-admin-heading material-edit-heading">
        <div><span className="eyebrow">EDIT STORE RESOURCE</span><h1>{material.title}</h1><p>Update its organisation and source without publishing it to students.</p></div>
        <span className="store-only-badge">Stored only · not live</span>
      </header>
      <div className="material-editor-layout">
        <aside className="admin-card material-editor-summary"><span className={`material-kind-icon ${material.type.toLowerCase()}`} aria-hidden="true">{material.type === "VIDEO" ? "▶" : "▤"}</span><h2>Resource details</h2><dl><div><dt>Type</dt><dd>{material.type}</dd></div><div><dt>Version</dt><dd>{material.latestVersion?.version ?? 1}</dd></div><div><dt>Subject</dt><dd>{material.subject}</dd></div><div><dt>Topic</dt><dd>{material.topic}</dd></div></dl>{material.latestVersion?.privateObjectKey && <a className="button secondary" href={`/api/admin/catalog/materials/${material.id}/preview`} target="_blank" rel="noreferrer">Preview current file</a>}</aside>
      <section className="admin-card material-editor-form">
        <div className="card-heading"><div><span className="eyebrow">RESOURCE SETTINGS</span><h2>{material.type === "VIDEO" ? "Video details" : "File and details"}</h2></div></div>
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
              <MaterialUploadForm material={material} />
            </>
          ) : (
            <MaterialCreateForm material={material} />
          )}
      </section></div>
      <div className="danger-zone-row"><div><strong>Delete resource</strong><span>Only possible when it is not linked to a package.</span></div><MaterialDeleteButton id={material.id} /></div>
    </WorkspaceShell>
  );
}
