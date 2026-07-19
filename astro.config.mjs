import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://astro.build/config
export default defineConfig({
  cacheDir: "./node_modules/.astro",
  // Astro 7 の JSX 空白規則への切り替えは、表示差分を検証してから別途行う。
  compressHTML: true,
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
