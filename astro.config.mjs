import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://astro.build/config
export default defineConfig({
  // 画像を最適化する（Astro5.10以降で実装）
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
    resolve: {
      alias: {
        // Add aliases for the `@/` directory
        "@/": `${path.resolve(__dirname, "src")}/`,
      },
    },
  },
  integrations: [tailwind({ applyBaseStyles: false }), react()],
});
