import type { APIRoute } from "astro";
import { getAllPosts } from "@/lib/posts";
import { groupByDateYmd, toYmd, getPartFromSlug } from "@/lib/dates";

/**
 * 旧URL（/diary/YYYYMMDD.html）の静的パス生成
 * - 全投稿を日付キーでグルーピングし、存在する日付のHTMLを用意
 */
export const getStaticPaths = async () => {
  const all = await getAllPosts();
  const byDate = groupByDateYmd(all);
  return Array.from(byDate.keys()).map((date) => ({ params: { date } }));
};

/**
 * 旧URLアクセス時の301リダイレクト
 * - 同日が1件: `/posts/YYYYMMDD/pNN` へ
 * - 同日が複数: `/posts/YYYYMMDD/` へ
 * - 見つからない: 404
 */
export const GET: APIRoute = async ({ params, redirect }) => {
  const date = params.date!; // YYYYMMDD
  const all = await getAllPosts();
  const todays = all.filter((p) => toYmd(p.data.date) === date);
  todays.sort((a, b) => a.slug.localeCompare(b.slug));
  if (todays.length === 0) return new Response("Not found", { status: 404 });
  if (todays.length === 1) {
    const only = todays[0];
    const slug = only.slug.split("/").pop()!; // e.g. 20040927p03
    const part = getPartFromSlug(slug);
    return redirect(`/posts/${date}/${part}`, 301);
  }
  return redirect(`/posts/${date}/`, 301);
};
