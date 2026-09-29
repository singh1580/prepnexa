import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { listSellableItems } from "@/features/admin-catalog/repository";
import { getProducts } from "@/features/admin-catalog/service";
import { ProductCreateForm } from "@/features/admin-catalog/ui/forms";
import { AdminModal } from "@/components/admin-modal";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

const access = [CONTENT_PERMISSIONS.manageProducts, CONTENT_PERMISSIONS.manageMaterials];
export const metadata = { title: "Packages and materials" };

export default async function Page() {
  const auth = await requireAnyWorkspacePermission(access);
  const canProducts = auth.permissions.includes(CONTENT_PERMISSIONS.manageProducts);
  const [products, items] = await Promise.all([
    canProducts ? getProducts() : Promise.resolve([]),
    canProducts ? listSellableItems() : Promise.resolve({ tests: [], materials: [] }),
  ]);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="packages">
    <header className="admin-page-header"><div><p className="admin-kicker">PRODUCT CATALOGUE</p><h1>Product package builder</h1><p>Combine one or more tests and study materials into a single priced package. Student visibility is controlled only from this product area.</p></div>{canProducts?<AdminModal label="+ New product" title="Create product package" description="Choose content, set the price and save the package." large><ProductCreateForm items={items}/></AdminModal>:null}</header>
    {products.length?<div className="product-folder-grid">{products.map(product=><article className="product-folder" key={product.id}><Link className="folder-link" href={`/admin/packages/${product.id}`}><span className="folder-icon">▰</span><div><h2>{product.name}</h2><p>{product.testCount} tests · {product.materialCount} materials · {product.accessDays} days</p></div><strong>₹{(product.pricePaise/100).toLocaleString("en-IN")}</strong></Link><footer><span>{product.testCount+product.materialCount} package items</span><span className={product.isLive?"status-pill success":"status-pill"}>{product.isLive?"Live":"Offline"}</span></footer></article>)}</div>:<div className="admin-card clean-empty tall"><span className="empty-icon">◇</span><strong>No product packages</strong><span>Create a package and select tests or materials from your inventory.</span></div>}
  </WorkspaceShell>;
}
