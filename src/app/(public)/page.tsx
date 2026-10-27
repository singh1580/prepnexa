import Link from "next/link";
import { HomeHeroCarousel } from "@/components/hero-carousel";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { getCurrentAuth } from "@/features/auth/authorization";
import { listAvailableProducts } from "@/features/catalog/repository";

function SearchIcon() {
  return (
    <svg
      className="absolute top-1/2 left-4 z-[1] w-[1.1rem] -translate-y-1/2 fill-none stroke-[#7b7e82] stroke-[1.7] max-[560px]:left-[0.9rem]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
export default async function Home() {
  const auth = await getCurrentAuth();
  const products = await listAvailableProducts(auth?.user.id);
  const popular = [...products].sort(
    (a, b) =>
      b.reviewCount * 10 +
      b.rating +
      b.testCount -
      (a.reviewCount * 10 + a.rating + a.testCount),
  );
  const featured = popular.slice(0, 3);
  const best = popular.slice(0, 4);
  const arrivals = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);
  const shelfClass =
    "mx-auto max-w-[1440px] px-[clamp(1.25rem,4.5vw,4.5rem)] pt-[1.4rem] pb-2 max-[560px]:px-4 max-[560px]:pt-[1.05rem] max-[560px]:pb-[0.2rem] [&>header]:mb-[0.85rem] [&>header]:flex [&>header]:items-center [&>header]:justify-between [&>header]:gap-4 [&>header_h2]:m-0 [&>header_h2]:text-[1.45rem] [&>header_h2]:tracking-[-0.025em] [&>header_a]:text-[0.73rem] [&>header_a]:font-[680] [&>header_a]:text-[#0759a3] max-[560px]:[&>header]:gap-3 max-[560px]:[&>header_h2]:text-xl max-[560px]:[&>header_h2]:whitespace-nowrap max-[560px]:[&>header_a]:shrink-0 max-[560px]:[&>header_a]:text-[0.64rem]";
  const shelfRail =
    "grid grid-flow-col items-stretch gap-4 overflow-x-auto overflow-y-hidden px-[0.1rem] pt-[0.1rem] pb-[0.65rem] [scroll-padding-inline:0.1rem] [scroll-snap-type:inline_mandatory] [overscroll-behavior-inline:contain] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [&>*]:flex [&>*]:h-full [&>*]:w-full [&>*]:snap-start [&>*]:flex-col";
  const featuredRail =
    "auto-cols-[minmax(17.5rem,calc((100%_-_2rem)/3))] max-[560px]:auto-cols-[minmax(16.5rem,82vw)]";
  const fourCardRail =
    "auto-cols-[minmax(16.5rem,calc((100%_-_2.4rem)/4))] max-[560px]:auto-cols-[minmax(16.5rem,82vw)]";
  return (
    <main className="store-home bg-white text-prep-ink">
      <section className="relative isolate min-h-[25.5rem] overflow-hidden border-b border-[#eee8e2] bg-[#fbf7f1] max-[560px]:min-h-[18.5rem]">
        <div className="absolute inset-0 z-0 w-full overflow-hidden bg-[#f8eee7]">
          <HomeHeroCarousel />
        </div>
        <div className="relative z-2 w-[min(50rem,52vw)] py-[3rem] pr-0 pb-[2.6rem] pl-[clamp(2rem,7vw,7.2rem)] min-[561px]:absolute min-[561px]:inset-y-0 min-[561px]:left-0 max-[1050px]:w-[62vw] max-[800px]:w-full max-[800px]:px-5 max-[800px]:py-8 max-[560px]:absolute max-[560px]:inset-0 max-[560px]:w-auto max-[560px]:min-h-0 max-[560px]:px-4 max-[560px]:pt-[0.95rem] max-[560px]:pb-[3.55rem] max-[380px]:px-[0.8rem]">
          <span className="text-[0.72rem] font-semibold tracking-[0.02em] text-[#687079] max-[560px]:text-[0.62rem] max-[560px]:font-[720]">
            YOUR EXAM PREPARATION PARTNER
          </span>
          <h1 className="my-[0.65rem] mb-[0.6rem] text-[clamp(2.6rem,4.1vw,4.35rem)] leading-[0.92] tracking-[-0.055em] max-[800px]:text-[2.75rem] max-[560px]:my-[0.48rem] max-[560px]:mb-[0.52rem] max-[560px]:max-w-[52%] max-[560px]:text-[clamp(1.42rem,6.2vw,1.68rem)] max-[560px]:leading-none max-[380px]:max-w-[56%]">
            Find the right
            <br />
            package for your
            <br />
            next exam
          </h1>
          <p className="m-0 max-w-[34rem] text-[0.94rem] leading-[1.45] text-[#52575d] max-[800px]:max-w-[29rem] max-[560px]:max-w-[52%] max-[560px]:text-[0.7rem] max-[560px]:leading-[1.38] max-[380px]:max-w-[56%]">
            Access expert-curated study material, video lectures, notes and test
            series for India&apos;s top competitive exams.
          </p>
          <form
            className="relative mt-[1.2rem] grid w-[min(100%,35rem)] grid-cols-[1fr_auto] drop-shadow-[0_0.45rem_0.8rem_#39201414] focus-within:rounded-[0.48rem] focus-within:shadow-[0_0_0_2px_rgba(232,71,20,.22)] min-[561px]:absolute min-[561px]:bottom-8 min-[561px]:left-[clamp(2rem,7vw,7.2rem)] min-[561px]:mt-0 max-[800px]:max-w-[32rem] max-[560px]:absolute max-[560px]:right-4 max-[560px]:bottom-[0.7rem] max-[560px]:left-4 max-[560px]:h-[2.65rem] max-[560px]:w-auto max-[560px]:grid-cols-[minmax(0,1fr)_5.25rem] max-[560px]:overflow-hidden max-[560px]:rounded-[0.48rem] max-[560px]:border max-[560px]:border-[#ded8d2] max-[560px]:bg-white max-[560px]:drop-shadow-none"
            action="/packages"
          >
            <SearchIcon />
            <input
              className="h-[3.15rem] min-w-0 rounded-l-[0.4rem] border border-r-0 border-[#dedbd6] bg-white py-[0.7rem] pr-4 pl-12 text-[0.75rem] outline-none max-[560px]:h-full max-[560px]:rounded-none max-[560px]:border-0 max-[560px]:pl-[2.45rem] max-[560px]:text-[0.7rem]"
              name="q"
              aria-label="Search exams, subjects or packages"
              placeholder="Search for exams, subjects or packages..."
            />
            <button
              className="min-w-[7.4rem] rounded-r-[0.4rem] border border-[#c83d0b] bg-[#c83d0b] font-bold text-white max-[560px]:h-full max-[560px]:min-w-0 max-[560px]:rounded-none max-[560px]:border-0 max-[560px]:px-[0.55rem] max-[560px]:text-[0.7rem]"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>
      </section>
      <section className={shelfClass}>
        <header>
          <h2>Featured packages</h2>
          <Link href="/packages">
            View all packages <span>→</span>
          </Link>
        </header>
        {featured.length ? (
          <div
            aria-label="Featured packages carousel"
            className={`${shelfRail} ${featuredRail}`}
            data-home-shelf
            role="region"
            tabIndex={0}
          >
            {featured.map((product, index) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                index={index}
                variant="featured"
                badge={index === 0 ? "Bestseller" : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[0.6rem] border border-[#e6e2dd] bg-[#fcfbf9] p-12 text-center text-[#777]">
            Packages are being prepared.
          </div>
        )}
      </section>
      {best.length ? (
        <section className={`${shelfClass} pt-4 max-[560px]:pt-3`}>
          <header>
            <h2>Best sellers</h2>
            <Link href="/packages?sort=popularity">
              View all <span>→</span>
            </Link>
          </header>
          <div
            aria-label="Best sellers carousel"
            className={`${shelfRail} ${fourCardRail}`}
            data-home-shelf
            role="region"
            tabIndex={0}
          >
            {best.map((product, index) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                index={index + 1}
                variant="compact"
              />
            ))}
          </div>
        </section>
      ) : null}
      {arrivals.length ? (
        <section className={`${shelfClass} pt-4 max-[560px]:pt-3`}>
          <header>
            <h2>New arrivals</h2>
            <Link href="/packages?sort=latest">
              View all <span>→</span>
            </Link>
          </header>
          <div
            aria-label="New arrivals carousel"
            className={`${shelfRail} ${fourCardRail}`}
            data-home-shelf
            role="region"
            tabIndex={0}
          >
            {arrivals.map((product, index) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                index={index + 2}
                variant="compact"
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
