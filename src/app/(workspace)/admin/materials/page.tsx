import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getMaterials } from "@/features/admin-catalog/service";
import { MaterialCreateForm, MaterialUploadForm } from "@/features/admin-catalog/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { MaterialLibrary } from "@/features/admin-catalog/ui/material-library";

export const metadata = { title: "Store & materials" };
export default async function Page() {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.manageMaterials);
  const materials = await getMaterials();
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="materials">
      <header className="admin-page-header reference-admin-heading"><div><h1>Store &amp; Materials</h1><p>Manage study materials for your store.</p></div><AdminModal label="＋ Add material" title="Add study material" description="Upload a private file or save a video link with its subject and topic." large><div className="material-create-grid"><section><h3>PDF or file</h3><MaterialUploadForm /></section><section><h3>Video resource</h3><MaterialCreateForm /></section></div></AdminModal></header>
      <MaterialLibrary items={materials.map(item=>({...item,updatedAt:new Date(item.updatedAt).toISOString()}))}/>
    </WorkspaceShell>
  );
}
