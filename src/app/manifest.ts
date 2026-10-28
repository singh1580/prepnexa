import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prepstore",
    short_name: "Prepstore",
    description:
      "Exam preparation packages, practice tests and study material.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e94b17",
    icons: [
      {
        src: "/prepstore-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/prepstore-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
