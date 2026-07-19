import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_POSTS_DIR = fileURLToPath(
  new URL("../src/content/posts/", import.meta.url),
);

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".md") ? [absolute] : [];
  });
}

function isDraft(markdown) {
  const frontmatter = markdown.match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
  )?.[1];
  return frontmatter ? /^draft:\s*true\s*$/m.test(frontmatter) : false;
}

export function createLegacyRedirects(postsDir = DEFAULT_POSTS_DIR) {
  const postsByDate = new Map();

  for (const file of markdownFiles(postsDir)) {
    const match = path.basename(file).match(/^(\d{8})(p\d+)\.md$/);
    if (!match || isDraft(readFileSync(file, "utf8"))) continue;

    const [, date, part] = match;
    const parts = postsByDate.get(date) ?? [];
    parts.push(part);
    postsByDate.set(date, parts);
  }

  const redirects = [
    { source: "/diary/", destination: "/", statusCode: 301 },
    { source: "/diary/index.html", destination: "/", statusCode: 301 },
  ];

  for (const [date, parts] of [...postsByDate.entries()].toSorted(([a], [b]) =>
    a.localeCompare(b),
  )) {
    parts.sort();
    redirects.push({
      source: `/diary/${date}.html`,
      destination:
        parts.length === 1 ? `/posts/${date}/${parts[0]}` : `/posts/${date}/`,
      statusCode: 301,
    });
  }

  return redirects;
}
