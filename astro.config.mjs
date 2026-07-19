import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://astro.build/config
export default defineConfig({
  cacheDir: "./node_modules/.astro",
  // Sharp を使い、Markdown画像をレスポンシブに最適化する。
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Add aliases for the `@/` directory
        "@/": `${path.resolve(__dirname, "src")}/`,
      },
    },
  },
});
