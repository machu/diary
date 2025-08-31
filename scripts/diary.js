#!/usr/bin/env node
// Create a new diary markdown file for today in src/content/posts/YYYY
// Filename: YYYYMMDDpNN.md, with frontmatter template and draft: true

import { mkdirSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function pad(n, width = 2) {
  return String(n).padStart(width, '0');
}

function formatDateParts(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return { y, m, d, ymd: `${y}${m}${d}`, y_m_d: `${y}-${m}-${d}` };
}

function nextPartIndex(dir, ymd) {
  try {
    const files = readdirSync(dir);
    const regex = new RegExp(`^${ymd}p(\\d{2})\\.md$`);
    const nums = files
      .map((f) => {
        const m = f.match(regex);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => Number.isInteger(n));
    if (nums.length === 0) return 1;
    return Math.max(...nums) + 1;
  } catch {
    return 1;
  }
}

function buildFrontmatter({ y_m_d }) {
  return `---\n` +
    `title: \n` +
    `date: "${y_m_d}"\n` +
    `description: \n` +
    `tags: []\n` +
    `draft: true\n` +
    `---\n\n`;
}

function main() {
  // Allow optional override: pnpm run diary -- 2025-08-31
  const arg = process.argv[2];
  let date = new Date();
  if (arg) {
    const normalized = arg.replaceAll('/', '-');
    const tryDate = new Date(normalized);
    if (!isNaN(tryDate.getTime())) {
      date = tryDate;
    } else {
      console.error(`Invalid date argument: ${arg} (expected YYYY-MM-DD)`);
      process.exit(1);
    }
  }

  const parts = formatDateParts(date);
  const baseDir = process.env.DIARY_BASE_DIR || join('src', 'content', 'posts');
  const yearDir = join(baseDir, String(parts.y));
  if (!existsSync(yearDir)) {
    mkdirSync(yearDir, { recursive: true });
  }
  const next = nextPartIndex(yearDir, parts.ymd);
  const filename = `${parts.ymd}p${pad(next)}.md`;
  const fullpath = join(yearDir, filename);

  const body = buildFrontmatter(parts) +
    `ここに本文を書きます。\n`;

  writeFileSync(fullpath, body, { encoding: 'utf8', flag: 'wx' });
  // Print relative path for convenience
  console.log(fullpath);

  // Try to open the created file in VS Code using the `code` CLI
  const noOpen = process.env.DIARY_NO_OPEN === '1' || process.env.CI === 'true' || process.env.NODE_ENV === 'test';
  if (!noOpen) {
    try {
      const res = spawnSync('code', ['-r', fullpath], { stdio: 'ignore' });
      if (res.error) {
        if (res.error.code === 'ENOENT') {
          console.error('`code` command not found. Skipping auto-open.');
        } else {
          console.error(`Failed to open with code: ${res.error.message}`);
        }
      } else if (typeof res.status === 'number' && res.status !== 0) {
        console.error(`code exited with status ${res.status}.`);
      }
    } catch (e) {
      console.error('Unable to launch `code`:', e instanceof Error ? e.message : String(e));
    }
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
