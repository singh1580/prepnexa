import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getMaterials } from "@/features/admin-catalog/service";
import { MaterialCreateForm, MaterialUploadForm } from "@/features/admin-catalog/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";

export const metadata = { title: "Store & materials" };
export default async function Page() {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.manageMaterials);
  const materials = await getMaterials();
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="materials">
      <header className="admin-page-header"><div><p className="admin-kicker">CONTENT INVENTORY</p><h1>Store & materials</h1><p>Save reusable PDFs, files and videos here. Only a live product package makes them visible to students.</p></div><AdminModal label="+ Add material" title="Add study material" description="Upload a private file or save a video link." large><div className="material-create-grid"><section><h3>PDF or file</h3><MaterialUploadForm /></section><section><h3>Video resource</h3><MaterialCreateForm /></section></div></AdminModal></header>
      <div className="admin-toolbar"><span>{materials.length} saved material{materials.length === 1 ? "" : "s"}</span></div>
      {materials.length ? <div className="file-grid">{materials.map((material) => <Link className="file-card" href={`/admin/materials/${material.id}`} key={material.id}><span className={material.type === "VIDEO" ? "file-type file-video" : "file-type"}>{material.type === "VIDEO" ? "▶" : material.type === "PDF" ? "PDF" : "FILE"}</span><div><h2>{material.title}</h2><p>{material.type === "VIDEO" ? "Video resource" : "Private study file"}</p></div><span className="file-meta">Updated {material.updatedAt.toLocaleDateString("en-IN")}</span></Link>)}</div> : <div className="admin-card clean-empty tall"><span className="empty-icon">▤</span><strong>No study material saved</strong><span>Add PDFs, files or video links to start your reusable library.</span></div>}
    </WorkspaceShell>
  );
}
