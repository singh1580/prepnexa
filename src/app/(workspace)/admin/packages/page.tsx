import Link from "next/link";
import { ProductCoverImage } from "@/components/product-cover-image";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { listSellableItems } from "@/features/admin-catalog/repository";
import { getProducts } from "@/features/admin-catalog/service";
import {
  ProductCreateForm,
  ProductVisibilityToggle,
} from "@/features/admin-catalog/ui/forms";
import { AdminModal } from "@/components/admin-modal";
import { requireAnyWorkspacePermission } from "@/features/auth/page-access";
import { AdminPageHeader } from "@/components/admin-page-header";

const access = [
  CONTENT_PERMISSIONS.manageProducts,
  CONTENT_PERMISSIONS.manageMaterials,
];
export const metadata = { title: "Packages and materials" };

export default async function Page() {
  const auth = await requireAnyWorkspacePermission(access);
  const canProducts = auth.permissions.includes(
    CONTENT_PERMISSIONS.manageProducts,
  );
  const [products, items] = await Promise.all([
    canProducts ? getProducts() : Promise.resolve([]),
    canProducts
      ? listSellableItems()
      : Promise.resolve({ tests: [], materials: [] }),
  ]);
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="packages"
    >
      <AdminPageHeader
        kicker="PRODUCT CATALOGUE"
        title="Product package builder"
        description="Combine one or more tests and study materials into a single priced package. Student visibility is controlled only from this product area."
      >
        {canProducts ? (
          <AdminModal
            label="+ New product"
            title="Create product package"
            description="Choose content, set the price and save the package."
            large
          >
            <ProductCreateForm items={items} />
          </AdminModal>
        ) : null}
      </AdminPageHeader>
      {products.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-[0.9rem]">
          {products.map((product) => (
            <article
              className="overflow-visible rounded-[0.55rem] border border-prep-line bg-white shadow-[0_0.5rem_1.8rem_#3a2b2107]"
              key={product.id}
            >
              <Link
                className="relative block h-[9.5rem] overflow-hidden bg-[linear-gradient(135deg,#28292d,#65301f_58%,#ef4d18)] text-white [&>img]:object-cover"
                href={`/admin/packages/${product.id}`}
              >
                {product.coverObjectKey ? (
                  <ProductCoverImage
                    productId={product.id}
                    alt={`${product.name} cover`}
                    sizes="(max-width: 700px) 100vw, 320px"
                    fallback={
                      <span className="flex h-full flex-col justify-end bg-[radial-gradient(circle_at_90%_15%,#ffffff26,transparent_38%)] p-4">
                        <b className="text-[1.05rem]">{product.name}</b>
                        <small className="mt-1 text-[#ffd8c8]">
                          Prepstore digital package
                        </small>
                      </span>
                    }
                  />
                ) : (
                  <span className="flex h-full flex-col justify-end bg-[radial-gradient(circle_at_90%_15%,#ffffff26,transparent_38%)] p-4">
                    <b className="text-[1.05rem]">{product.name}</b>
                    <small className="mt-1 text-[#ffd8c8]">
                      Prepstore digital package
                    </small>
                  </span>
                )}
              </Link>
              <div className="p-[0.85rem]">
                <Link href={`/admin/packages/${product.id}`}>
                  <h2 className="m-0 text-[0.85rem] leading-[1.35]">
                    {product.name}
                  </h2>
                </Link>
                <strong className="my-[0.35rem] block text-base text-prep-orange">
                  ₹{(product.pricePaise / 100).toLocaleString("en-IN")}
                </strong>
                <div className="grid grid-cols-2 gap-[0.35rem] border-y border-prep-line py-3 text-[0.65rem] text-[#697076] [&_span:last-child]:col-span-full">
                  <span>▤ {product.materialCount} materials</span>
                  <span>▣ {product.testCount} tests</span>
                  <span>◷ {product.accessDays} days access</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-[0.45rem] pt-[0.85rem]">
                  <ProductVisibilityToggle
                    id={product.id}
                    isLive={product.isLive}
                  />
                  <Link
                    className="inline-flex min-h-[2.45rem] items-center justify-center rounded-prep-control border border-prep-orange bg-white px-[0.9rem] py-[0.55rem] text-sm font-bold text-prep-orange-dark hover:bg-prep-orange-wash"
                    href={`/admin/packages/${product.id}`}
                  >
                    Edit
                  </Link>
                  <details className="relative">
                    <summary
                      className="grid size-8 cursor-pointer list-none place-items-center text-lg marker:hidden [&::-webkit-details-marker]:hidden"
                      aria-label={`More actions for ${product.name}`}
                    >
                      ⋮
                    </summary>
                    <div className="absolute top-full right-0 z-10 w-36 rounded-[.4rem] border border-[#ddd] bg-white p-[.4rem] shadow-[0_.7rem_1.8rem_#0002]">
                      <Link
                        className="block p-[.45rem] text-[.7rem]"
                        href={`/admin/packages/${product.id}`}
                      >
                        Open package
                      </Link>
                    </div>
                  </details>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[0.65rem] border border-prep-line bg-white p-6 text-center text-prep-muted">
          <span className="mb-3 text-4xl text-prep-orange">◇</span>
          <strong>No product packages</strong>
          <span>
            Create a package and select tests or materials from your inventory.
          </span>
        </div>
      )}
    </WorkspaceShell>
  );
}
