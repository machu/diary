import { describe, expect, it } from "vitest";
import {
  buildRelatedPostsMap,
  type RelatedPostEntry,
} from "@/lib/related-posts";

function post(
  id: string,
  date: string,
  title = "",
  body = "",
): RelatedPostEntry {
  return {
    id,
    body,
    data: { title, date: new Date(`${date}T00:00:00Z`) },
  };
}

describe("buildRelatedPostsMap", () => {
  it("excludes the current post and other entries from the same day", async () => {
    const posts = [
      post("20250101p01", "2025-01-01", "Rubyの型", "Rubyで型を書く"),
      post("20250101p02", "2025-01-01", "Ruby入門", "Rubyを始めた"),
      post("20250102p01", "2025-01-02", "Rubyの実行", "Rubyを動かす"),
    ];

    expect(
      (await buildRelatedPostsMap(posts))
        .get("20250101p01")
        ?.map(({ id }) => id),
    ).toEqual(["20250102p01"]);
  });

  it("prefers articles sharing more distinctive title and body terms", async () => {
    const current = post(
      "current",
      "2025-01-10",
      "AstroにPagefind検索を追加",
      "静的サイトへPagefindの全文検索インデックスを組み込んだ。",
    );
    const close = post(
      "close",
      "2024-01-01",
      "Pagefindでブログを検索",
      "Astroの静的HTMLから全文検索インデックスを生成する。",
    );
    const partial = post(
      "partial",
      "2025-01-09",
      "Astroで画像を最適化",
      "静的サイトの画像変換を設定した。",
    );

    expect(
      (await buildRelatedPostsMap([current, partial, close], 1))
        .get(current.id)
        ?.map(({ id }) => id),
    ).toEqual(["close"]);
  });

  it("uses date proximity and then the newer post to break ties", async () => {
    const posts = [
      post("current", "2025-01-10", "天気予報", "明日の天気を確認"),
      post("older", "2025-01-09", "天気予報", "明日の天気を確認"),
      post("newer", "2025-01-11", "天気予報", "明日の天気を確認"),
      post("distant", "2025-01-01", "天気予報", "明日の天気を確認"),
    ];

    expect(
      (await buildRelatedPostsMap(posts, 2))
        .get("current")
        ?.map(({ id }) => id),
    ).toEqual(["newer", "older"]);
  });

  it("returns no candidates for empty content or a zero count", async () => {
    const posts = [
      post("empty", "2025-01-01"),
      post("content", "2025-01-02", "Astro", "静的サイト"),
    ];

    expect((await buildRelatedPostsMap(posts)).get("empty")).toEqual([]);
    expect((await buildRelatedPostsMap(posts, 0)).get("content")).toEqual([]);
  });
});
