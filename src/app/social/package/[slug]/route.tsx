import { ImageResponse } from "next/og";
import { findAvailableProduct } from "@/features/catalog/repository";
import { normaliseProductName } from "@/features/catalog/presentation";
import { productCoverUrl } from "@/features/catalog/cover";
import { absoluteUrl } from "@/config/site";

const size = { width: 1200, height: 630 };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const product = await findAvailableProduct((await params).slug);
  const name = normaliseProductName(product?.name ?? "Exam preparation package");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 54, padding: 58, background: "linear-gradient(135deg, #fffaf7 0%, #ffffff 58%, #ffe8dc 100%)", color: "#151719", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: 630, height: 438, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 20, background: "#f4eee8" }}>
        {product?.coverObjectKey ? (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders remote images through Satori, not next/image.
          <img src={absoluteUrl(productCoverUrl(product.id, product.coverObjectKey))} alt="" width="630" height="438" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#E84714" }}>Prepstore</div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}><span style={{ color: "#E84714" }}>Prep</span><span>store</span></div>
        <div style={{ marginTop: 34, fontSize: 55, lineHeight: 1.06, fontWeight: 800, letterSpacing: -1.6 }}>{name}</div>
        <div style={{ marginTop: 28, fontSize: 24, lineHeight: 1.35, color: "#60666c" }}>Study material, practice sets and mock tests in one package.</div>
      </div>
    </div>,
    { ...size, headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}
