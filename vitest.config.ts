import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.resolve(__dirname, "src")}/`,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/output/**", "tests/e2e/**"],
    globals: true,
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      enabled: true,
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      exclude: ["**/node_modules/**", "tests/**"],
    },
  },
});
