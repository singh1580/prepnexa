import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { agentUpgrade: "security" },
  turbopack: { root: process.cwd() },
  images: {
    localPatterns: [{ pathname: "/media/product-covers/**" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: [...SECURITY_HEADERS] }];
  },
};
export default nextConfig;
