import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load, type CheerioAPI } from "cheerio";

export const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const DIST_DIR = path.join(PROJECT_ROOT, "dist");

export async function requireDist(): Promise<void> {
  try {
    await access(path.join(DIST_DIR, "index.html"));
  } catch {
    throw new Error(
      "dist/index.html がありません。先に `pnpm build` を実行してください。",
    );
  }
}

async function walk(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute, base)));
    } else {
      files.push(path.relative(base, absolute));
    }
  }

  return files;
}

export async function listOutputFiles(): Promise<string[]> {
  return (await walk(DIST_DIR)).toSorted();
}

export async function listHtmlFiles(): Promise<string[]> {
  return (await listOutputFiles()).filter((file) => file.endsWith(".html"));
}

export async function readOutput(relativePath: string): Promise<string> {
  return readFile(path.join(DIST_DIR, relativePath), "utf8");
}

export async function readDocument(
  relativePath: string,
): Promise<{ html: string; $: CheerioAPI }> {
  const html = await readOutput(relativePath);
  return { html, $: load(html) };
}

export function urlToOutputPath(url: string): string {
  const pathname = decodeURIComponent(
    new URL(url, "https://example.test").pathname,
  );
  if (pathname === "/") return "index.html";
  if (pathname.endsWith(".html")) return pathname.slice(1);
  return path.join(pathname.slice(1), "index.html");
}

export async function outputPathExists(relativePath: string): Promise<boolean> {
  try {
    await access(path.join(DIST_DIR, relativePath));
    return true;
  } catch {
    return false;
  }
}

export function toDisplayDate(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

export function redirectDestination($: CheerioAPI): string | undefined {
  const refresh = $('meta[http-equiv="refresh" i]').attr("content");
  const match = refresh?.match(/^\s*0\s*;\s*url=(.+)\s*$/i);
  return match?.[1];
}
