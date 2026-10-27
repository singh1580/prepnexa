import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { getProduct } from "@/features/admin-catalog/service";
import {
  ProductBundleControls,
  ProductCreateForm,
} from "@/features/admin-catalog/ui/forms";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { AppError } from "@/lib/errors/app-error";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AdminPageHeader } from "@/components/admin-page-header";
import { adminBackLink, adminDangerZone } from "@/components/admin-styles";

export const metadata = { title: "Package bundle" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspacePermission(
    CONTENT_PERMISSIONS.manageProducts,
  );
  const parsed = catalogIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  let product: Awaited<ReturnType<typeof getProduct>>;
  try {
    product = await getProduct(parsed.data);
  } catch (error) {
    if (error instanceof AppError && error.code === "CONTENT_NOT_FOUND")
      notFound();
    throw error;
  }
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="packages"
    >
      <Link className={adminBackLink} href="/admin/packages">
        ← Packages & materials
      </Link>
      <AdminPageHeader
        kicker={product.slug}
        title={product.name}
        description={`₹${(product.pricePaise / 100).toLocaleString("en-IN")} · ${product.accessDays} days access`}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(22rem,0.62fr)] items-start gap-4 max-[1180px]:grid-cols-1">
        <section className="min-w-0 rounded-[0.65rem] border border-prep-line bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <h2 className="mb-4 text-lg font-bold">Package details</h2>
          <ProductCreateForm product={product} />
        </section>
        <section className="min-w-0">
          <ProductBundleControls
            id={product.id}
            isLive={product.isLive}
            linkedTests={product.linkedTests}
            linkedMaterials={product.linkedMaterials}
            availableTests={product.availableTests}
            availableMaterials={product.availableMaterials}
          />
        </section>
      </div>
      <div className={adminDangerZone}>
        <div>
          <strong>Delete product package</strong>
          <span>
            Only offline packages without orders or student access can be
            deleted.
          </span>
        </div>
        <AdminDeleteButton
          endpoint={`/api/admin/catalog/products/${product.id}`}
          redirectTo="/admin/packages"
          label="Delete product"
          confirmation="Delete this offline product permanently? Products used in orders or student access cannot be deleted."
        />
      </div>
    </WorkspaceShell>
  );
}
