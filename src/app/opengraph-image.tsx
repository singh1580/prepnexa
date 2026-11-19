import { ImageResponse } from "next/og";

export const alt = "Prepstore exam preparation packages and practice tests";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "76px 92px",
        background: "linear-gradient(135deg, #fffaf7 0%, #ffffff 52%, #ffe8dc 100%)",
        color: "#151719",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 54, fontWeight: 800 }}>
        <span style={{ color: "#E84714" }}>Prep</span><span style={{ marginLeft: -18 }}>store</span>
      </div>
      <div style={{ marginTop: 46, maxWidth: 930, fontSize: 66, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
        Prepare smarter for your next exam
      </div>
      <div style={{ marginTop: 26, maxWidth: 900, fontSize: 30, lineHeight: 1.35, color: "#555d64" }}>
        Expert-curated study material, practice sets and full-length mock tests.
      </div>
      <div style={{ marginTop: 55, width: 170, height: 8, borderRadius: 99, background: "#E84714" }} />
    </div>,
    size,
  );
}
