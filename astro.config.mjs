import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";
import { access, readFile } from "node:fs/promises";
import path, { dirname } from "path";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pagefindOutput = path.resolve(__dirname, "dist/pagefind");

const pagefindContentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".wasm", "application/wasm"],
]);

/**
 * `pnpm build`で生成したPagefindバンドルをAstro devでも配信する。
 * dist全体は公開せず、/pagefind/配下の実ファイルだけを対象にする。
 */
function pagefindDevAssets() {
  return {
    name: "pagefind-dev-assets",
    apply: "serve",
    async configureServer(server) {
      let hasPagefindBundle = true;
      try {
        await access(path.join(pagefindOutput, "pagefind.js"));
      } catch {
        hasPagefindBundle = false;
        server.config.logger.warn(
          "[pagefind] 検索を使うには pnpm build を実行してから開発サーバーを再起動してください。",
        );
      }

      server.middlewares.use(async (request, response, next) => {
        if (!hasPagefindBundle || !request.url) return next();

        let pathname;
        try {
          pathname = decodeURIComponent(
            new URL(request.url, "http://localhost").pathname,
          );
        } catch {
          return next();
        }

        if (!pathname.startsWith("/pagefind/")) return next();
        const relativePath = pathname.slice("/pagefind/".length);
        if (!relativePath || relativePath.endsWith("/")) return next();

        const filePath = path.resolve(pagefindOutput, relativePath);
        if (!filePath.startsWith(`${pagefindOutput}${path.sep}`)) return next();

        try {
          const content = await readFile(filePath);
          const contentType =
            pagefindContentTypes.get(path.extname(filePath)) ??
            "application/octet-stream";
          response.statusCode = 200;
          response.setHeader("Content-Type", contentType);
          response.setHeader("Cache-Control", "no-store");
          if (request.method === "HEAD") return response.end();
          response.end(content);
        } catch (error) {
          if (error && error.code === "ENOENT") return next();
          next(error);
        }
      });
    },
  };
}

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
    plugins: [tailwindcss(), pagefindDevAssets()],
    resolve: {
      alias: {
        // Add aliases for the `@/` directory
        "@/": `${path.resolve(__dirname, "src")}/`,
      },
    },
  },
});
