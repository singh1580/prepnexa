import Link from "next/link";
import { AddToCartButton } from "@/features/commerce/ui/cart-workflow";
import {
  formatAccessDuration,
  formatCount,
  normaliseProductName,
} from "@/features/catalog/presentation";
import { ProductCoverImage } from "./product-cover-image";
import { UiIcon } from "./ui-icon";

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  language: string;
  coverObjectKey: string | null;
  mrpPaise: number | null;
  pricePaise: number;
  accessDays: number;
  testCount: number;
  materialCount: number;
  rating: number;
  reviewCount: number;
  subjects?: string[];
  materialTypes?: string[];
  alreadyOwned?: boolean;
};

const price = (paise: number) =>
  paise === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(paise / 100);
function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4M9.5 12h5M9.5 16h5" />
    </svg>
  );
}
function TestIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function StorefrontProductCard({
  product,
  index = 0,
  variant = "catalog",
  badge,
}: {
  product: StorefrontProduct;
  index?: number;
  variant?: "featured" | "compact" | "catalog";
  badge?: string;
}) {
  const discount =
    product.mrpPaise && product.mrpPaise > product.pricePaise
      ? Math.round((1 - product.pricePaise / product.mrpPaise) * 100)
      : 0;
  const productName = normaliseProductName(product.name);
  const homeCard = variant !== "catalog";
  const cardClass =
    "flex h-full min-w-0 flex-col overflow-hidden rounded-[0.46rem] border border-[#dedfdf] bg-white shadow-[0_0.18rem_0.5rem_#37231808] transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-[#d6b7aa] hover:shadow-[0_0.65rem_1.5rem_#3d231514]";
  const toneClass = [
    "bg-[#f3ddd1] bg-[linear-gradient(135deg,#fff8f3_0%,#f3c5b0_52%,#e75a25_100%)]",
    "bg-[#e7edf8] bg-[linear-gradient(135deg,#f9fbff_0%,#d7e1f3_52%,#7289bb_100%)]",
    "bg-[#e3f0e9] bg-[linear-gradient(135deg,#fbfffc_0%,#cfe6d8_52%,#579876_100%)]",
    "bg-[#f2ead2] bg-[linear-gradient(135deg,#fffdf7_0%,#eadcae_52%,#b8933e_100%)]",
    "bg-[#ede3f3] bg-[linear-gradient(135deg,#fdfaff_0%,#ddcbea_52%,#8e69a6_100%)]",
    "bg-[#dcecef] bg-[linear-gradient(135deg,#f8feff_0%,#c3e0e5_52%,#4f9099_100%)]",
  ][index % 6];
  const artworkClass = `${toneClass} before:absolute before:right-[-2.4rem] before:bottom-[-3.5rem] before:h-40 before:w-40 before:rounded-full before:border-[1.35rem] before:border-white/35 before:shadow-[0_0_0_1.4rem_rgba(255,255,255,0.12)] after:absolute after:inset-0 after:bg-[linear-gradient(90deg,#ffffff12,transparent_65%)]`;
  const coverClass = `relative block overflow-hidden bg-cover bg-center bg-no-repeat text-[#14202a] ${
    variant === "compact"
      ? "h-[6.45rem] p-3"
      : variant === "catalog"
        ? "h-[9.2rem] p-4 max-[560px]:h-[10.75rem] max-[340px]:h-[9.75rem]"
        : "h-[10.7rem] p-4"
  } ${homeCard ? "max-[560px]:h-auto max-[560px]:aspect-[3/2]" : ""} ${
    product.coverObjectKey
      ? "bg-[#f8f4ef] bg-none after:hidden"
      : artworkClass
  }`;
  const bodyClass = homeCard
    ? `${variant === "compact" ? "p-[0.55rem]" : "p-[0.72rem]"} max-[560px]:grid max-[560px]:flex-1 max-[560px]:content-start max-[560px]:grid-rows-[auto_auto_auto] max-[560px]:p-2`
    : "p-[0.7rem] max-[560px]:p-[0.85rem]";
  const titleClass = homeCard
    ? `${variant === "compact" ? "text-[0.84rem]" : "text-[1rem]"} my-[0.68rem] mb-[0.35rem] block line-clamp-2 leading-[1.3] font-[760] text-[#16181a] max-[560px]:mb-[0.25rem] max-[560px]:min-h-0 max-[560px]:text-[0.9rem] max-[560px]:leading-[1.3]`
    : "my-[0.68rem] mb-[0.35rem] block text-[0.82rem] leading-[1.3] font-[760] text-[#16181a] max-[560px]:mb-[0.28rem] max-[560px]:text-base";
  const coverCopy = (
    <span
      className={`relative z-[2] grid w-[70%] gap-[0.22rem] text-[0.84rem] ${badge ? "mt-[1.3rem]" : ""}`}
    >
      <b
        className={`${variant === "compact" ? "text-base" : "text-[1.35rem]"} leading-[1.05] tracking-[-0.035em] max-[560px]:text-base`}
      >
        {productName.replace(/\bpackage\b/gi, "").trim()}
      </b>
      <small className={variant === "compact" ? "text-[0.62rem]" : "text-[0.7rem]"}>
        Complete Package
      </small>
    </span>
  );
  return (
    <article className={cardClass} data-store-product>
      <Link
        className={coverClass}
        href={`/packages/${product.slug}`}
      >
        <span className="sr-only">View {productName} package details</span>
        {product.coverObjectKey ? (
          <ProductCoverImage
            productId={product.id}
            alt={`${productName} cover`}
            sizes={
              homeCard
                ? "(max-width: 560px) 82vw, (max-width: 1100px) 17.5rem, 25vw"
                : "(max-width: 560px) 100vw, 33vw"
            }
            fallback={(
              <span
                aria-hidden="true"
                className={`absolute inset-0 p-3 text-[#14202a] ${artworkClass}`}
              >
                {coverCopy}
              </span>
            )}
          />
        ) : null}
        {badge ? (
          <span
            className={
              homeCard
                ? "absolute top-[0.6rem] left-[0.6rem] z-[3] rounded-[0.22rem] bg-prep-orange px-[0.42rem] py-[0.23rem] text-[0.58rem] font-extrabold text-white"
                : "absolute top-[0.6rem] left-[0.6rem] z-[3] rounded-[0.22rem] bg-prep-orange px-[0.42rem] py-[0.23rem] text-[0.58rem] font-extrabold text-white"
            }
          >
            {badge}
          </span>
        ) : null}
        {product.coverObjectKey ? null : coverCopy}
      </Link>
      <div className={bodyClass}>
        {variant === "catalog" ? (
          <div className="grid grid-cols-2 gap-[0.45rem] border-b border-[#ecebea] pb-2 text-[0.66rem] text-[#33383d] max-[560px]:gap-3 max-[560px]:pb-[0.6rem] max-[560px]:text-[0.68rem] [&_span]:flex [&_span]:min-w-0 [&_span]:items-center [&_span]:gap-[0.38rem] [&_svg]:w-[0.85rem] [&_svg]:shrink-0 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.6]">
            <span>
              <FileIcon />
              {formatCount(product.materialCount, "material")}
            </span>
            <span>
              <TestIcon />
              {formatCount(product.testCount, "test")}
            </span>
          </div>
        ) : null}
        <Link className={titleClass} href={`/packages/${product.slug}`}>
          {productName}
        </Link>
        {variant !== "compact" ? (
          <div
            className={
              homeCard
                ? "mt-[0.45rem] grid grid-cols-2 gap-[0.45rem] text-[0.72rem] text-[#4f555a] max-[560px]:my-[0.2rem] max-[560px]:gap-[0.35rem] max-[560px]:text-[0.68rem] [&_span]:flex [&_span]:min-w-0 [&_span]:items-center [&_span]:gap-[0.38rem] [&_svg]:w-[0.85rem] [&_svg]:shrink-0 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.7]"
                : "my-[0.55rem] grid grid-cols-2 gap-[0.45rem] text-[0.6rem] text-[#4f555a] max-[560px]:gap-[0.55rem] max-[560px]:text-[0.68rem] [&_span]:flex [&_span]:min-w-0 [&_span]:items-center [&_span]:gap-[0.38rem] [&_svg]:w-[0.85rem] [&_svg]:shrink-0 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.7]"
            }
          >
            <span>
              <UiIcon name="language" />
              {product.language === "BILINGUAL"
                ? "English & Hindi"
                : product.language
                    .toLowerCase()
                    .replace(/^./, (letter) => letter.toUpperCase())}
            </span>
            <span>
              <ClockIcon />
              {formatAccessDuration(product.accessDays)} access
            </span>
          </div>
        ) : null}
        <div
          className={
            homeCard
              ? "mt-[0.45rem] flex items-center gap-[0.52rem] max-[560px]:mt-[0.2rem] max-[560px]:grid max-[560px]:grid-cols-[auto_auto_minmax(0,1fr)] max-[560px]:gap-x-[0.28rem] max-[560px]:gap-y-[0.16rem]"
              : "mt-[0.65rem] flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.4rem]"
          }
        >
          <strong
            className={
              homeCard
                ? `${variant === "compact" ? "text-[0.85rem]" : "text-[1.02rem]"} max-[560px]:w-auto max-[560px]:text-[0.82rem] max-[560px]:whitespace-nowrap`
                : "text-[1.02rem] max-[560px]:text-[1.12rem]"
            }
          >
            {price(product.pricePaise)}
          </strong>
          {product.mrpPaise && product.mrpPaise > product.pricePaise ? (
            <del
              className={
                homeCard
                  ? "text-[0.7rem] text-prep-muted max-[560px]:text-[0.56rem] max-[560px]:whitespace-nowrap"
                  : "text-[0.7rem] text-prep-muted"
              }
            >
              {price(product.mrpPaise)}
            </del>
          ) : null}
          {discount > 0 ? (
            <span
              className={
                homeCard
                  ? "rounded-[0.28rem] bg-[#dff2d9] px-[0.36rem] py-[0.18rem] text-[0.62rem] font-extrabold text-[#35713c] max-[560px]:justify-self-end max-[560px]:px-[0.25rem] max-[560px]:py-[0.14rem] max-[560px]:text-[0.52rem] max-[560px]:whitespace-nowrap"
                  : "rounded-[0.28rem] bg-[#dff2d9] px-[0.36rem] py-[0.18rem] text-[0.62rem] font-extrabold text-[#35713c]"
              }
            >
              {discount}% off
            </span>
          ) : null}
        </div>
        {variant !== "compact" ? (
          <div
            className={
              homeCard
                ? "mt-3 grid grid-cols-2 gap-2 max-[560px]:mt-[0.35rem] max-[560px]:gap-[0.28rem]"
                : "mt-[0.65rem] grid grid-cols-2 gap-2 max-[560px]:mt-[0.8rem] max-[560px]:gap-[0.6rem]"
            }
          >
            <Link
              className={
                homeCard
                  ? "grid min-h-[2.45rem] place-items-center rounded-[0.35rem] border border-[#d44a19] p-[0.55rem] text-center text-[0.78rem] font-[720] text-[#c33b0c] max-[560px]:min-w-0 max-[560px]:px-[0.45rem] max-[560px]:text-[0.7rem]"
                  : "grid min-h-9 place-items-center rounded-[0.35rem] border border-[#d44a19] p-[0.55rem] text-center text-[0.66rem] font-[720] text-[#c33b0c] max-[560px]:inline-flex max-[560px]:min-h-[2.65rem] max-[560px]:justify-center max-[560px]:p-[0.6rem] max-[560px]:text-[0.72rem] max-[560px]:leading-[1.2] max-[560px]:whitespace-nowrap"
              }
              href={`/packages/${product.slug}`}
            >
              View details
            </Link>
            {product.alreadyOwned ? (
              <Link
                className={
                  homeCard
                    ? "grid min-h-[2.45rem] place-items-center rounded-[0.35rem] border border-[#c73c0b] bg-[#c73c0b] p-[0.55rem] text-center text-[0.78rem] font-[720] text-white max-[560px]:min-w-0 max-[560px]:px-[0.45rem] max-[560px]:text-[0.7rem]"
                    : "grid min-h-9 place-items-center rounded-[0.35rem] border border-[#f2bca8] bg-[#fff7f2] p-[0.55rem] text-center text-[0.66rem] font-[720] text-[#d74312] max-[560px]:inline-flex max-[560px]:min-h-[2.65rem] max-[560px]:justify-center max-[560px]:p-[0.6rem] max-[560px]:text-[0.72rem] max-[560px]:leading-[1.2] max-[560px]:whitespace-nowrap"
                }
                href={`/dashboard/courses/${product.slug}`}
              >
                Open package →
              </Link>
            ) : (
              <AddToCartButton
                productId={product.id}
                className={
                  homeCard
                    ? "grid min-h-[2.45rem] place-items-center rounded-[0.35rem] border border-[#c73c0b] bg-[#c73c0b] p-[0.55rem] text-center text-[0.78rem] font-[720] text-white hover:bg-[#a82f06] max-[560px]:min-w-0 max-[560px]:px-[0.45rem] max-[560px]:text-[0.7rem]"
                    : "grid min-h-9 place-items-center rounded-[0.35rem] border border-[#c73c0b] bg-[#c73c0b] p-[0.55rem] text-center text-[0.66rem] font-[720] text-white hover:bg-[#a82f06] max-[560px]:inline-flex max-[560px]:min-h-[2.65rem] max-[560px]:justify-center max-[560px]:p-[0.6rem] max-[560px]:text-[0.72rem] max-[560px]:leading-[1.2] max-[560px]:whitespace-nowrap"
                }
              />
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
