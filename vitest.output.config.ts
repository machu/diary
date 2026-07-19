import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/output/**/*.test.ts"],
    globals: true,
    coverage: {
      enabled: false,
    },
    testTimeout: 30_000,
  },
});
