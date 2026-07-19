import { access, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const distDir = path.resolve(process.argv[2] ?? "dist");
const postsDir = path.join(distDir, "posts");

async function hasIndexHtml(directory) {
  try {
    await access(path.join(directory, "index.html"));
    return true;
  } catch {
    return false;
  }
}

async function collectPostParts() {
  const dates = new Map();
  const dateEntries = await readdir(postsDir, { withFileTypes: true });

  for (const dateEntry of dateEntries) {
    if (!dateEntry.isDirectory() || !/^\d{8}$/.test(dateEntry.name)) continue;
    const dateDir = path.join(postsDir, dateEntry.name);
    const partEntries = await readdir(dateDir, { withFileTypes: true });
    const parts = [];

    for (const partEntry of partEntries) {
      if (!partEntry.isDirectory() || !/^p\d+$/.test(partEntry.name)) continue;
      if (await hasIndexHtml(path.join(dateDir, partEntry.name))) {
        parts.push(partEntry.name);
      }
    }

    if (parts.length > 0) dates.set(dateEntry.name, parts.toSorted());
  }

  return dates;
}

const postsByDate = await collectPostParts();
if (postsByDate.size === 0) {
  throw new Error(
    `${postsDir} に公開済みの記事がありません。先に Astro をビルドしてください。`,
  );
}

const rules = [
  { source: "/diary/", destination: "/", statusCode: 301 },
  { source: "/diary/index.html", destination: "/", statusCode: 301 },
];

for (const [date, parts] of [...postsByDate.entries()].toSorted(([a], [b]) =>
  a.localeCompare(b),
)) {
  rules.push({
    source: `/diary/${date}.html`,
    destination:
      parts.length === 1 ? `/posts/${date}/${parts[0]}` : `/posts/${date}/`,
    statusCode: 301,
  });
}

const outputPath = path.join(distDir, "redirects.jsonl");
await writeFile(
  outputPath,
  `${rules.map((rule) => JSON.stringify(rule)).join("\n")}\n`,
  "utf8",
);
console.log(`Generated ${rules.length} redirects: ${outputPath}`);
