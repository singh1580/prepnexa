import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getMaterials } from "@/features/admin-catalog/service";
import { MaterialCreateWorkspace } from "@/features/admin-catalog/ui/forms";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { MaterialLibrary } from "@/features/admin-catalog/ui/material-library";

export const metadata = { title: "Store & materials" };
export default async function Page() {
  const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.manageMaterials);
  const materials = await getMaterials();
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="materials">
      <header className="admin-page-header reference-admin-heading"><div><h1>Store &amp; Materials</h1><p>Upload and organise reusable study resources. Saved materials become selectable in Product Package Builder.</p></div><AdminModal label="＋ Add material" title="Add study material" description="Create one organised resource for your private material store." large><MaterialCreateWorkspace /></AdminModal></header>
      <MaterialLibrary items={materials.map(item=>({...item,updatedAt:new Date(item.updatedAt).toISOString()}))}/>
    </WorkspaceShell>
  );
}
