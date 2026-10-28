import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetailCover } from "@/components/product-detail-cover";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { getCurrentAuth } from "@/features/auth/authorization";
import { ADMIN_ROLE_KEYS } from "@/features/auth/constants";
import {
  findAvailableProduct,
  hasActiveProductAccess,
  listAvailableProducts,
} from "@/features/catalog/repository";
import {
  formatAccessDuration,
  formatCount,
  meaningfulProductDescription,
  normaliseProductName,
} from "@/features/catalog/presentation";
import { ProductDetailTabs } from "@/features/catalog/ui/product-detail-tabs";
import { SyllabusAccordion } from "@/features/catalog/ui/syllabus-accordion";
import { CheckoutCard } from "@/features/commerce/ui/checkout-card";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, SITE_ORIGIN } from "@/config/site";

export const dynamic = "force-dynamic";
const getAvailableProduct = cache(findAvailableProduct);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getAvailableProduct((await params).slug);
  if (!product) return { title: "Package not found" };
  const name = normaliseProductName(product.name);
  const description =
    product.seoDescription ||
    meaningfulProductDescription(
      product.description,
      product.name,
      product.slug,
      `Explore ${name} study materials and practice tests on Prepstore.`,
    );
  const canonical = `/packages/${product.slug}`;
  const image = `/api/catalog/products/${product.id}/cover`;
  return {
    title: product.seoTitle || name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.seoTitle || name,
      description,
      url: canonical,
      images: product.coverObjectKey
        ? [{ url: image, alt: `${name} cover` }]
        : undefined,
    },
    twitter: {
      card: product.coverObjectKey ? "summary_large_image" : "summary",
      title: product.seoTitle || name,
      description,
      images: product.coverObjectKey ? [image] : undefined,
    },
  };
}

const money = (value: number) =>
  value === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value / 100);
function FactIcon({
  kind,
}: {
  kind: "calendar" | "language" | "video" | "material" | "test";
}) {
  const paths = {
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    language: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </>
    ),
    video: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4z" />
      </>
    ),
    material: (
      <>
        <path d="M6 3h9l3 3v15H6zM14 3v4h4M9 12h6M9 16h6" />
      </>
    ),
    test: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const auth = await getCurrentAuth();
  const product = await getAvailableProduct((await params).slug);
  if (!product) notFound();
  const [owned, available] = await Promise.all([
    hasActiveProductAccess(product.id, auth?.user.id),
    listAvailableProducts(auth?.user.id),
  ]);
  const related = available
    .filter((item) => item.id !== product.id && !item.alreadyOwned)
    .slice(0, 3);
  const discount =
    product.mrpPaise && product.mrpPaise > product.pricePaise
      ? Math.round((1 - product.pricePaise / product.mrpPaise) * 100)
      : 0;
  const syllabus = (product.syllabus ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const language =
    product.language === "BILINGUAL"
      ? "English & Hindi"
      : product.language
          .toLowerCase()
          .replace(/^./, (value) => value.toUpperCase());
  const productName = normaliseProductName(product.name);
  const reviewWorkspace = auth?.roles.some((role) => ADMIN_ROLE_KEYS.has(role))
    ? "/admin/reviews"
    : "/dashboard/reviews";
  const productDescription = meaningfulProductDescription(
    product.description,
    product.name,
    product.slug,
    "Your complete exam preparation package with structured learning and practice.",
  );
  const productUrl = absoluteUrl(`/packages/${product.slug}`);
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: productName,
    description: productDescription,
    url: productUrl,
    image: product.coverObjectKey
      ? [absoluteUrl(`/api/catalog/products/${product.id}/cover`)]
      : [absoluteUrl("/prepstore-icon-512.png")],
    sku: product.id,
    brand: { "@type": "Brand", name: "Prepstore" },
    category: product.category || product.examName || "Exam preparation",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.currency,
      price: (product.pricePaise / 100).toFixed(2),
      availability: "https://schema.org/OnlineOnly",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        "@id": `${SITE_ORIGIN}/#organization`,
        name: "Prepstore",
        url: SITE_ORIGIN,
      },
    },
  };
  if (product.reviewCount > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating.toFixed(1)),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_ORIGIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Packages",
        item: absoluteUrl("/packages"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: productUrl,
      },
    ],
  };
  return (
    <main className="mx-auto max-w-[1440px] bg-white px-[clamp(1.25rem,4.5vw,4.5rem)] pt-4 pb-6 text-[#14171b]">
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      <nav
        className="my-[0.2rem] mb-5 flex max-w-full items-center gap-[0.55rem] overflow-x-auto text-[0.78rem] whitespace-nowrap text-[#667078] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_b]:overflow-hidden [&_b]:text-ellipsis [&_b]:text-[#202326]"
        aria-label="Breadcrumb"
      >
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href="/packages">All packages</Link>
        <span>›</span>
        <b>{productName}</b>
      </nav>
      <section className="grid grid-cols-[minmax(17rem,34%)_minmax(0,1fr)] items-stretch gap-8 max-[1000px]:grid-cols-[minmax(16rem,38%)_minmax(0,1fr)] max-[800px]:grid-cols-1">
        <ProductDetailCover
          productId={product.id}
          name={productName}
          hasCover={Boolean(product.coverObjectKey)}
        />
        <div className="min-w-0 py-[0.45rem]">
          <h1 className="m-0 mb-[0.35rem] max-w-[58rem] text-[clamp(2rem,3vw,3.3rem)] leading-[1.03] tracking-[-0.045em]">
            {productName}
          </h1>
          <p className="my-[0.35rem] text-[0.88rem] text-[#61666c]">
            {productDescription}
          </p>
          <dl className="my-4 grid grid-cols-3 gap-2 text-[0.72rem] max-[700px]:grid-cols-1 [&>div]:rounded-[0.45rem] [&>div]:border [&>div]:border-[#e7e2dc] [&>div]:bg-[#fcfaf8] [&>div]:p-3 [&_dd]:m-0 [&_dd]:mt-1 [&_dd]:font-bold [&_dd]:text-[#24272a] [&_dt]:text-[#73797e]">
            {product.examName ? (
              <div>
                <dt>Exam</dt>
                <dd>{product.examName}</dd>
              </div>
            ) : null}
            {product.category ? (
              <div>
                <dt>Category</dt>
                <dd>{product.category}</dd>
              </div>
            ) : null}
            {product.targetAudience ? (
              <div>
                <dt>Best suited for</dt>
                <dd>{product.targetAudience}</dd>
              </div>
            ) : null}
          </dl>
          <div className="my-4 flex items-center gap-[0.45rem] text-xs max-[560px]:flex-wrap max-[560px]:items-start [&>b]:tracking-[0.08em]">
            <b
              className={
                product.reviewCount ? "text-[#ff9d00]" : "text-[#b8aa9e]"
              }
            >
              {product.reviewCount ? "★★★★★" : "☆☆☆☆☆"}
            </b>
            {product.reviewCount ? (
              <>
                <strong>{product.rating.toFixed(1)}</strong>
                <span>({formatCount(product.reviewCount, "review")})</span>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
            <i className="ml-[0.7rem] not-italic text-[#18864b] max-[560px]:ml-0 max-[560px]:w-full">
              ● Trusted by Prepstore learners
            </i>
          </div>
          <div className="my-5 mt-5 flex items-baseline gap-[0.8rem] max-[560px]:flex-wrap">
            <del className="text-[1.1rem] text-[#656b72]">
              {product.mrpPaise && product.mrpPaise > product.pricePaise
                ? money(product.mrpPaise)
                : null}
            </del>
            <strong className="text-[2rem] text-[#ed4511]">
              {money(product.pricePaise)}
            </strong>
            {discount > 0 ? (
              <span className="rounded-full border border-[#ff9e7c] bg-[#fff5f0] px-[0.55rem] py-[0.3rem] text-[0.72rem] font-extrabold text-[#e44a19]">
                {discount}% OFF
              </span>
            ) : null}
            <small className="ml-[-0.4rem] self-end text-[#777]">
              Final price shown at checkout
            </small>
          </div>
          <div className="my-5 grid grid-cols-5 border-y border-[#e6e4e1] max-[1000px]:grid-cols-3 max-[560px]:grid-cols-2 [&>span]:grid [&>span]:grid-cols-[auto_1fr] [&>span]:gap-x-[0.45rem] [&>span]:gap-y-[0.1rem] [&>span]:border-r [&>span]:border-[#e6e4e1] [&>span]:px-[0.65rem] [&>span]:py-4 [&>span:last-child]:border-r-0 max-[1000px]:[&>span:nth-child(3)]:border-r-0 max-[1000px]:[&>span:nth-child(n+4)]:border-t max-[560px]:[&>span]:border-t max-[560px]:[&>span:nth-child(2n)]:border-r-0 max-[560px]:[&>span:nth-child(3)]:border-r max-[560px]:[&>span:nth-child(5)]:col-span-full max-[560px]:[&>span:nth-child(5)]:border-r-0 [&_b]:text-[0.76rem] [&_small]:text-[0.62rem] [&_small]:text-[#777d83] [&_svg]:row-span-2 [&_svg]:w-[1.35rem] [&_svg]:fill-none [&_svg]:stroke-[#555c63] [&_svg]:stroke-[1.6]">
            <span>
              <FactIcon kind="calendar" />
              <b>{formatAccessDuration(product.accessDays)}</b>
              <small>Access duration</small>
            </span>
            <span>
              <FactIcon kind="language" />
              <b>{language}</b>
              <small>Language</small>
            </span>
            <span>
              <FactIcon kind="video" />
              <b>{formatCount(product.materials.length, "resource")}</b>
              <small>Study content</small>
            </span>
            <span>
              <FactIcon kind="material" />
              <b>{product.materials.length.toLocaleString("en-IN")}</b>
              <small>Materials</small>
            </span>
            <span>
              <FactIcon kind="test" />
              <b>{product.tests.length.toLocaleString("en-IN")}</b>
              <small>Mock tests</small>
            </span>
          </div>
          <CheckoutCard
            productId={product.id}
            slug={product.slug}
            pricePaise={product.pricePaise}
            owned={owned}
          />
        </div>
      </section>
      <ProductDetailTabs
        panels={{
          description: (
            <section>
              <h2>Description</h2>
              <p>
                {meaningfulProductDescription(
                  product.description,
                  product.name,
                  product.slug,
                  "Study, practise and analyse your preparation from one organised package workspace.",
                )}
              </p>
            </section>
          ),
          syllabus: (
            <section>
              {syllabus.length ? (
                <SyllabusAccordion topics={syllabus} />
              ) : (
                <>
                  <h2>Syllabus</h2>
                  <p className="leading-[1.65]">
                    The detailed syllabus will be added soon.
                  </p>
                </>
              )}
            </section>
          ),
          included: (
            <section>
              <h2>What&apos;s included</h2>
              <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1 [&_article]:flex [&_article]:items-center [&_article]:gap-[0.8rem] [&_article]:rounded-lg [&_article]:border [&_article]:border-[#e2e0dd] [&_article]:p-4 [&_h3]:my-[0.15rem] [&_p]:my-[0.15rem] [&_p]:text-[0.72rem] [&_p]:text-[#73787d] [&_svg]:w-[1.35rem] [&_svg]:shrink-0 [&_svg]:fill-none [&_svg]:stroke-[#555c63] [&_svg]:stroke-[1.6]">
                <article>
                  <FactIcon kind="test" />
                  <div>
                    <h3>Tests &amp; practice sets</h3>
                    <p>
                      {product.tests.length} linked test
                      {product.tests.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </article>
                <article>
                  <FactIcon kind="material" />
                  <div>
                    <h3>Study materials</h3>
                    <p>
                      {product.materials.length} linked resource
                      {product.materials.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </article>
              </div>
              {product.tests.length ? (
                <div className="mt-[0.7rem] grid grid-cols-2 gap-2 max-[800px]:grid-cols-1 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:rounded-[0.35rem] [&>div]:border [&>div]:border-[#ebe8e4] [&>div]:p-3 [&>div]:text-[0.72rem] [&_span]:text-[#777] [&_span]:capitalize">
                  {product.tests.map((test) => (
                    <div key={test.id}>
                      <b>{test.title}</b>
                      <span>
                        {test.mode.toLowerCase()} · {test.durationMinutes}{" "}
                        minutes
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {product.materials.length ? (
                <div className="mt-[0.7rem] grid grid-cols-2 gap-2 max-[800px]:grid-cols-1 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:rounded-[0.35rem] [&>div]:border [&>div]:border-[#ebe8e4] [&>div]:p-3 [&>div]:text-[0.72rem] [&_span]:text-[#777] [&_span]:capitalize">
                  {product.materials.map((material) => (
                    <div key={material.id}>
                      <b>{material.title}</b>
                      <span>{material.type.toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ),
          reviews: (
            <section>
              <h2>Reviews</h2>
              {product.reviews.length ? (
                <div className="mb-6 grid gap-[0.7rem] [&_article]:rounded-[0.65rem] [&_article]:border [&_article]:border-prep-line [&_article]:bg-white [&_article]:p-4 [&_header]:flex [&_header]:justify-between [&_header]:gap-4 [&_header_span]:tracking-[0.08em] [&_header_span]:text-[#dc5b2b] [&_p]:text-prep-ink [&_small]:text-prep-muted">
                  {product.reviews.map((review) => (
                    <article key={review.id}>
                      <header>
                        <strong>{review.name}</strong>
                        <span>
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </span>
                      </header>
                      <p>{review.comment}</p>
                      <small>
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          { dateStyle: "medium" },
                        )}
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="leading-[1.65]">
                  Be the first verified learner to review this package.
                </p>
              )}
              <p className="mt-5 mb-0 rounded-[0.55rem] border border-[#f0d9cf] bg-[#fff8f4] p-4 text-[#6e5a51] [&_a]:font-[750] [&_a]:text-prep-orange">
                <Link
                  href={
                    auth
                      ? reviewWorkspace
                      : "/login?next=%2Fdashboard%2Freviews"
                  }
                >
                  {auth
                    ? reviewWorkspace === "/admin/reviews"
                      ? "Manage package reviews"
                      : "Review this package from Review & Feedback"
                    : "Sign in to review a purchased package"}
                </Link>
                .
              </p>
            </section>
          ),
          faqs: (
            <section>
              <h2>FAQs</h2>
              <details>
                <summary>Where will I find this package?</summary>
                <p>
                  After confirmed payment it appears inside My Packages in your
                  student dashboard.
                </p>
              </details>
              <details>
                <summary>Is this a physical product?</summary>
                <p>No. Prepstore sells digital preparation packages only.</p>
              </details>
              <details>
                <summary>Can I access materials and tests together?</summary>
                <p>
                  Yes. Materials, tests and results stay organised inside this
                  package.
                </p>
              </details>
            </section>
          ),
        }}
      />
      {related.length ? (
        <section className="mt-[0.35rem] border-t border-prep-line pt-5 pb-2 max-[560px]:mt-[0.2rem] max-[560px]:pt-4">
          <header className="mb-[0.8rem] flex items-center justify-between">
            <h2 className="m-0 text-[1.35rem]">Related packages</h2>
            <Link
              className="text-[0.72rem] font-bold text-prep-orange"
              href="/packages"
            >
              View all <span>→</span>
            </Link>
          </header>
          <div className="grid grid-cols-3 gap-[0.8rem] max-[1000px]:grid-cols-2 max-[1000px]:[&>[data-store-product]:last-child]:hidden max-[560px]:grid-flow-col max-[560px]:grid-cols-none max-[560px]:auto-cols-[minmax(14rem,76%)] max-[560px]:gap-3 max-[560px]:overflow-x-auto max-[560px]:overflow-y-hidden max-[560px]:px-[0.05rem] max-[560px]:pt-[0.15rem] max-[560px]:pb-[0.65rem] max-[560px]:[scrollbar-width:none] max-[560px]:[scroll-snap-type:inline_mandatory] max-[560px]:[overscroll-behavior-inline:contain] max-[560px]:[&::-webkit-scrollbar]:hidden max-[560px]:[&>[data-store-product]]:block max-[560px]:[&>[data-store-product]]:h-auto max-[560px]:[&>[data-store-product]]:w-full max-[560px]:[&>[data-store-product]]:[scroll-snap-align:start] max-[560px]:[&>[data-store-product]:last-child]:block">
            {related.map((item, index) => (
              <StorefrontProductCard
                key={item.id}
                product={item}
                index={index + 1}
                variant="catalog"
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
