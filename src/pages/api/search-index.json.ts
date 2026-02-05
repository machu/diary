import type { APIRoute } from "astro";
import { getAllPosts } from "@/lib/posts";
import { toYmd, buildEntryUrl, getPartFromSlug } from "@/lib/dates";
import { mdToPlainText } from "@/lib/markdown";

/**
 * ビルド時に /api/search-index.json を静的生成する。
 * 各記事の title, date, tags, url, excerpt(先頭500文字) を含む。
 */

const EXCERPT_LENGTH = 500;

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  const sorted = posts.toSorted((a, b) => +b.data.date - +a.data.date);

  const entries = await Promise.all(
    sorted.map(async (post) => {
      const url = buildEntryUrl(post.data.date, post.slug);
      const dateYmd = toYmd(post.data.date);
      let excerpt = post.data.description ?? "";
      if (post.body) {
        const plain = await mdToPlainText(post.body);
        excerpt = plain.slice(0, EXCERPT_LENGTH);
      }
      return {
        title: post.data.title,
        date: dateYmd,
        tags: post.data.tags ?? [],
        url,
        excerpt,
      };
    })
  );

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
};
