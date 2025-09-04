import type { APIRoute } from "astro";

// /diary/ へのアクセスはサイトトップへ恒久的にリダイレクト
export const GET: APIRoute = ({ redirect }) => redirect("/", 301);

