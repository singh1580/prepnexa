import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/health/route.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/db", "@/db/*"], message: "Routes and pages must call a feature service instead of the database directly." }] }],
    },
  },
  globalIgnores([".next/**","coverage/**","next-env.d.ts"]),
]);
