import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    env: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://test:test@localhost/test",
      DATABASE_URL_UNPOOLED: "postgresql://test:test@localhost/test",
      AUTH_SECRET: "unit-test-auth-secret-with-32-characters",
      PASSWORD_PEPPER: "unit-test-password-pepper",
    },
  },
});
