import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/config/site";
import { listSitemapProducts } from "@/features/catalog/repository";

export const dynamic = "force-dynamic";

const publicPages = [
  "",
  "/about",
  "/packages",
  "/contact",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cancellation-refund",
  "/legal/fair-use",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listSitemapProducts();
  return [
    ...publicPages.map((path) => ({
      url: `${SITE_ORIGIN}${path || "/"}`,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path === "/packages" ? 0.9 : 0.5,
    })),
    ...products.map((product) => ({
      url: `${SITE_ORIGIN}/packages/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
