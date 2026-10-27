import Link from "next/link";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { StorefrontProductCard } from "@/components/storefront-product-card";
import { getCurrentAuth } from "@/features/auth/authorization";
import { listAvailableProducts } from "@/features/catalog/repository";
import { CatalogFilterDisclosure } from "@/features/catalog/ui/catalog-filter-disclosure";

export const dynamic = "force-dynamic";
export const metadata = { title: "All packages" };
type Query = {
  q?: string;
  sort?: string;
  subject?: string | string[];
  price?: string | string[];
  language?: string | string[];
  format?: string | string[];
};
const many = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const checked = (values: string[], value: string) => values.includes(value);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const query = await searchParams;
  const q = query.q?.trim().toLowerCase() ?? "";
  const subjects = many(query.subject);
  const prices = many(query.price);
  const languages = many(query.language);
  const formats = many(query.format);
  const sort = query.sort ?? "popularity";
  const auth = await getCurrentAuth();
  const all = await listAvailableProducts(auth?.user.id);
  const subjectCounts = new Map<string, number>();
  for (const product of all) {
    for (const subject of product.subjects) {
      subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
    }
  }
  const matchesPrice = (value: number) =>
    !prices.length ||
    prices.some((range) =>
      range === "under2000"
        ? value < 200000
        : range === "2000-5000"
          ? value >= 200000 && value < 500000
          : range === "5000-10000"
            ? value >= 500000 && value <= 1000000
            : range === "above10000"
              ? value > 1000000
              : false,
    );
  const matchesFormat = (product: (typeof all)[number]) =>
    !formats.length ||
    formats.some((format) =>
      format === "pdf"
        ? product.materialTypes.includes("PDF")
        : format === "video"
          ? product.materialTypes.includes("VIDEO")
          : format === "notes"
            ? product.materialTypes.includes("FILE")
            : format === "tests"
              ? product.testCount > 0
              : format === "bundle"
                ? product.materialCount > 0 && product.testCount > 0
                : false,
    );
  const rows = all.filter(
    (product) =>
      (!q ||
        `${product.name} ${product.description ?? ""} ${product.syllabus ?? ""} ${product.subjects.join(" ")}`
          .toLowerCase()
          .includes(q)) &&
      (!subjects.length ||
        subjects.some((subject) => product.subjects.includes(subject))) &&
      matchesPrice(product.pricePaise) &&
      (!languages.length || languages.includes(product.language)) &&
      matchesFormat(product),
  );
  rows.sort((a, b) =>
    sort === "latest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : sort === "price-low"
        ? a.pricePaise - b.pricePaise
        : sort === "price-high"
          ? b.pricePaise - a.pricePaise
          : b.reviewCount * 10 +
            b.rating +
            b.testCount -
            (a.reviewCount * 10 + a.rating + a.testCount),
  );
  const activeFilterCount =
    subjects.length + prices.length + languages.length + formats.length;
  const filterActive = activeFilterCount > 0;
  return (
    <main className="mx-auto max-w-[1500px] bg-white px-[clamp(1.2rem,3.8vw,4rem)] pt-4 pb-14 text-[#151719] max-[560px]:px-4 max-[560px]:pt-[0.8rem] max-[560px]:pb-10">
      <nav
        className="my-[0.2rem] mb-4 flex items-center gap-[0.55rem] text-[0.78rem] text-[#667078] [&_b]:text-[#202326]"
        aria-label="Breadcrumb"
      >
        <Link href="/">Home</Link>
        <span>›</span>
        <b>All packages</b>
      </nav>
      <AutoSubmitForm className="max-[560px]:grid max-[560px]:grid-cols-2 max-[560px]:gap-3">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-[.55rem] border border-[#d9dadd] bg-white shadow-[0_.35rem_1rem_rgba(32,24,18,.04)] focus-within:border-prep-orange focus-within:ring-2 focus-within:ring-[#ffdfd2] max-[560px]:col-span-full">
          <label className="sr-only" htmlFor="package-search">Search packages</label>
          <input
            className="min-h-12 min-w-0 border-0 bg-transparent px-4 text-[.82rem] outline-none"
            id="package-search"
            name="q"
            type="search"
            defaultValue={query.q}
            placeholder="Search by package, subject or exam…"
          />
          <button className="min-w-24 border-0 bg-prep-orange px-5 text-[.78rem] font-bold text-white hover:bg-prep-orange-dark" type="submit">
            Search
          </button>
        </div>
        <header className="mb-5 flex items-end justify-between gap-8 max-[800px]:flex-col max-[800px]:items-start max-[560px]:contents">
          <div className="max-[560px]:col-span-full max-[560px]:mb-[-0.15rem]">
            <h1 className="m-0 text-[2.2rem] tracking-[-0.04em] max-[560px]:text-[1.75rem]">
              All packages
            </h1>
            <p className="mt-[0.3rem] mb-0 text-[0.78rem] text-[#6c7176] max-[560px]:mt-1 max-[560px]:text-[0.76rem]">
              Explore our complete range of exam preparation packages
            </p>
          </div>
          <div className="flex items-center gap-5 text-[0.74rem] text-[#3f4449] max-[800px]:grid max-[800px]:w-full max-[800px]:grid-cols-1 max-[560px]:contents">
            <span className="max-[560px]:col-span-full max-[560px]:mt-[-0.1rem] max-[560px]:text-[0.7rem] max-[560px]:text-[#6b7176]">
              Showing {rows.length} of {all.length} packages
            </span>
            <label className="flex h-[2.45rem] min-w-[11.6rem] items-center overflow-hidden rounded-[0.4rem] border border-[#d9dadd] bg-white pl-3 focus-within:border-[#df4c18] focus-within:shadow-[0_0_0_1px_#df4c18] max-[800px]:w-full max-[800px]:min-w-0 max-[560px]:col-start-1 max-[560px]:h-[2.7rem] max-[560px]:rounded-[0.55rem] max-[560px]:border-[#ddd9d4] max-[560px]:pl-[0.72rem] max-[340px]:pl-[0.58rem]">
              <span className="max-[560px]:mr-1 max-[560px]:shrink-0 max-[560px]:font-medium max-[560px]:whitespace-nowrap max-[560px]:text-[#5f666c]">
                Sort by:
              </span>
              <select
                className="h-full min-w-0 border-0 bg-transparent py-[0.45rem] pr-8 pl-[0.35rem] font-semibold outline-0 max-[800px]:w-full max-[560px]:p-0 max-[560px]:pr-[1.35rem] max-[560px]:text-[0.7rem]"
                name="sort"
                defaultValue={sort}
              >
                <option value="popularity">Popularity</option>
                <option value="latest">Newest</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
              </select>
            </label>
          </div>
        </header>
        <div className="grid grid-cols-[13rem_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-1 max-[560px]:contents">
          <CatalogFilterDisclosure
            activeCount={activeFilterCount}
            defaultOpen={filterActive}
          >
            <FilterSection title="Subject">
              {[...subjectCounts.entries()].map(([subject, count]) => (
                <label key={subject}>
                  <input
                    type="checkbox"
                    name="subject"
                    value={subject}
                    defaultChecked={checked(subjects, subject)}
                  />
                  <span>
                    {subject} ({count})
                  </span>
                </label>
              ))}
            </FilterSection>
            <FilterSection title="Price">
              <Check
                name="price"
                value="under2000"
                label="Under ₹2,000"
                selected={prices}
              />
              <Check
                name="price"
                value="2000-5000"
                label="₹2,000 - ₹5,000"
                selected={prices}
              />
              <Check
                name="price"
                value="5000-10000"
                label="₹5,000 - ₹10,000"
                selected={prices}
              />
              <Check
                name="price"
                value="above10000"
                label="Above ₹10,000"
                selected={prices}
              />
            </FilterSection>
            <FilterSection title="Language">
              <Check
                name="language"
                value="ENGLISH"
                label="English"
                selected={languages}
              />
              <Check
                name="language"
                value="HINDI"
                label="Hindi"
                selected={languages}
              />
              <Check
                name="language"
                value="BILINGUAL"
                label="English & Hindi"
                selected={languages}
              />
            </FilterSection>
            <FilterSection title="Format">
              <Check name="format" value="pdf" label="PDF" selected={formats} />
              <Check
                name="format"
                value="video"
                label="Video"
                selected={formats}
              />
              <Check
                name="format"
                value="notes"
                label="Notes"
                selected={formats}
              />
              <Check
                name="format"
                value="tests"
                label="Test Series"
                selected={formats}
              />
              <Check
                name="format"
                value="bundle"
                label="Bundle"
                selected={formats}
              />
            </FilterSection>
            {filterActive ? (
              <Link
                className="block p-[0.9rem] text-[0.66rem] text-[#c33a0b] underline max-[1100px]:col-span-full"
                href={
                  q
                    ? `/packages?q=${encodeURIComponent(query.q ?? "")}`
                    : "/packages"
                }
              >
                Clear all filters
              </Link>
            ) : null}
          </CatalogFilterDisclosure>
          <section className="min-w-0 max-[560px]:col-span-full">
            {rows.length ? (
              <div className="grid grid-cols-3 gap-[0.8rem] max-[1050px]:grid-cols-2 max-[560px]:grid-cols-1 max-[560px]:gap-[0.9rem]">
                {rows.map((product, index) => (
                  <StorefrontProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    variant="catalog"
                    badge={
                      index === 0 && sort === "popularity"
                        ? "Bestseller"
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-prep-line bg-prep-orange-wash px-6 py-12 text-center">
                <h2 className="m-0 text-xl">No packages match these filters</h2>
                <p className="mt-2 mb-5 text-sm text-prep-muted">
                  Clear a filter or try another search.
                </p>
                <Link
                  className="font-bold text-prep-orange-dark"
                  href="/packages"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </section>
        </div>
      </AutoSubmitForm>
    </main>
  );
}
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="m-0 grid gap-[0.48rem] border-0 border-b border-[#e8e5e1] p-[0.9rem] max-[1100px]:odd:border-l max-[560px]:border-l-0 [&_label]:flex [&_label]:items-center [&_label]:gap-2 [&_label]:text-[0.74rem] [&_label]:leading-[1.3] [&_label]:text-[#565c61] [&_input]:m-0 [&_input]:h-[0.8rem] [&_input]:w-[0.8rem] [&_input]:accent-[#cf400d]">
      <legend className="mb-2 flex w-full justify-between text-[0.78rem] font-[760] text-[#1f2225]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
function Check({
  name,
  value,
  label,
  selected,
}: {
  name: string;
  value: string;
  label: string;
  selected: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[0.74rem] leading-[1.3] text-[#565c61]">
      <input
        className="m-0 h-[0.8rem] w-[0.8rem] accent-[#cf400d]"
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked(selected, value)}
      />
      <span>{label}</span>
    </label>
  );
}
