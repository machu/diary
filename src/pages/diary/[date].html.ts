import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths = async () => {
  const all = await getCollection("posts");
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };
  const byDate = new Map<string, typeof all>();
  for (const p of all) {
    const key = fmt(p.data.date);
    const list = byDate.get(key) ?? [];
    list.push(p);
    byDate.set(key, list);
  }
  return Array.from(byDate.keys()).map((date) => ({ params: { date } }));
};

export const GET: APIRoute = async ({ params, redirect }) => {
  const date = params.date!; // YYYYMMDD
  const all = await getCollection("posts");
  const todays = all.filter((p) => {
    const d = p.data.date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}` === date;
  });
  todays.sort((a, b) => a.slug.localeCompare(b.slug));
  if (todays.length === 0) return new Response("Not found", { status: 404 });
  if (todays.length === 1) {
    const only = todays[0];
    const slug = only.slug.split("/").pop()!; // e.g. 20040927p03
    const part = slug.slice(8);
    return redirect(`/posts/${date}/${part}`, 301);
  }
  return redirect(`/posts/${date}/`, 301);
};

