import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getProduct } from "@/features/admin-catalog/service";
import { ProductBundleControls, ProductCreateForm, CatalogActions } from "@/features/admin-catalog/ui/forms";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { AppError } from "@/lib/errors/app-error";

export const metadata = { title: "Package bundle" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const auth = await requireWorkspacePermission(CONTENT_PERMISSIONS.manageProducts); const parsed = catalogIdSchema.safeParse((await params).id); if (!parsed.success) notFound(); let product: Awaited<ReturnType<typeof getProduct>>; try { product = await getProduct(parsed.data); } catch (error) { if (error instanceof AppError && error.code === "CONTENT_NOT_FOUND") notFound(); throw error; } return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="packages"><Link className="back-link" href="/admin/packages">← Packages & materials</Link><header className="page-heading split-heading"><div><span className="eyebrow">{product.slug}</span><h1>{product.name}</h1><p>₹{(product.pricePaise / 100).toLocaleString("en-IN")} · {product.accessDays} days access</p></div><span className={`status-pill content-${product.status.toLowerCase()}`}>{product.status}</span></header>{product.status === "DRAFT" && <section className="panel"><h2>Package details</h2><ProductCreateForm product={product} /></section>}<CatalogActions id={product.id} kind="products" status={product.status} /><ProductBundleControls id={product.id} status={product.status} linkedTests={product.linkedTests} linkedMaterials={product.linkedMaterials} availableTests={product.availableTests} availableMaterials={product.availableMaterials} /></WorkspaceShell>; }
