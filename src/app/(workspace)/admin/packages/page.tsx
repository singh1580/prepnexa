import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getCatalogExams, getMaterials, getProducts } from "@/features/admin-catalog/service";
import { MaterialCreateForm, MaterialPublishButton, ProductCreateForm } from "@/features/admin-catalog/ui/forms";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";

const access = [CONTENT_PERMISSIONS.manageProducts, CONTENT_PERMISSIONS.manageMaterials];
export const metadata = { title: "Packages and materials" };

export default async function Page() {
  const auth = await requireAnyWorkspacePermission(access);
  const canProducts = auth.permissions.includes(CONTENT_PERMISSIONS.manageProducts);
  const canMaterials = auth.permissions.includes(CONTENT_PERMISSIONS.manageMaterials);
  const [products, materials, exams] = await Promise.all([
    canProducts ? getProducts() : Promise.resolve([]),
    canMaterials ? getMaterials() : Promise.resolve([]),
    canMaterials ? getCatalogExams() : Promise.resolve([]),
  ]);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="packages">
    <header className="page-heading"><span className="eyebrow">CATALOG OPERATIONS</span><h1>Packages and study materials</h1><p>Organise your tests and study materials into packages.</p></header>
    <div className="catalog-admin-grid">
      {canProducts ? <section><div className="section-heading"><div><span className="eyebrow">PACKAGES</span><h2>Access bundles</h2></div></div>{products.length ? <div className="managed-list">{products.map((product) => <Link className="managed-card" href={`/admin/packages/${product.id}`} key={product.id}><div><span className="eyebrow">₹{(product.pricePaise / 100).toLocaleString("en-IN")} · {product.accessDays} DAYS</span><h2>{product.name}</h2><p>{product.testCount} tests · {product.materialCount} materials</p></div><span className={`status-pill content-${product.status.toLowerCase()}`}>{product.status}</span><b>→</b></Link>)}</div> : <div className="panel empty-state compact-empty"><h2>No packages yet</h2></div>}<section className="panel"><span className="eyebrow">NEW PACKAGE</span><h2>Create package</h2><ProductCreateForm /></section></section> : null}
      {canMaterials ? <section><div className="section-heading"><div><span className="eyebrow">MATERIALS</span><h2>Study materials</h2></div></div><div className="material-list">{materials.map((material) => <article className="panel" key={material.id}><span className="eyebrow">{material.examName} · {material.type}</span><h2><Link href={`/admin/materials/${material.id}`}>{material.title}</Link></h2><div className="material-action"><span className={`status-pill content-${material.status.toLowerCase()}`}>{material.status}</span>{material.status === "DRAFT" ? <MaterialPublishButton id={material.id} /> : null}</div></article>)}</div>{exams.length > 0 ? <section className="panel"><span className="eyebrow">NEW MATERIAL</span><h2>Add study material</h2><MaterialCreateForm exams={exams} /></section> : null}</section> : null}
    </div>
  </WorkspaceShell>;
}
