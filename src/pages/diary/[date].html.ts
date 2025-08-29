import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { groupByDateYmd, toYmd, getPartFromSlug } from "@/lib/dates";

export const getStaticPaths = async () => {
  const all = await getCollection("posts");
  const byDate = groupByDateYmd(all);
  return Array.from(byDate.keys()).map((date) => ({ params: { date } }));
};

export const GET: APIRoute = async ({ params, redirect }) => {
  const date = params.date!; // YYYYMMDD
  const all = await getCollection("posts");
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
