export interface PagefindData {
  url: string;
  plain_excerpt: string;
  meta: Record<string, string | undefined>;
}

interface PagefindResult {
  data: () => Promise<PagefindData>;
}

interface PagefindResponse {
  results: PagefindResult[];
}

interface PagefindApi {
  init?: () => Promise<void>;
  preload?: (query: string, options?: Record<string, unknown>) => Promise<void>;
  debouncedSearch: (
    query: string,
    options?: Record<string, unknown>,
    debounceMs?: number,
  ) => Promise<PagefindResponse | null>;
}

export interface PagefindSearchResult {
  /** 一致した総件数（ページング前） */
  total: number;
  /** この呼び出しで返したエントリ（offset〜offset+limit） */
  entries: PagefindData[];
  /** 未取得の結果が残っているか */
  hasMore: boolean;
}

type CachedSearch = {
  query: string;
  results: PagefindResult[];
};

let pagefindPromise: Promise<PagefindApi> | undefined;

/**
 * 直近の検索結果（PagefindResult の配列）をクエリ単位で保持する。
 * 「もっと見る」で検索をやり直さずに続きを取得するために使う。
 */
let cachedSearch: CachedSearch | undefined;

function loadPagefind(): Promise<PagefindApi> {
  const pagefindUrl = "/pagefind/pagefind.js";
  pagefindPromise ??= import(/* @vite-ignore */ pagefindUrl).then(
    (module) => module as PagefindApi,
  );
  return pagefindPromise;
}

async function requestResults(
  query: string,
  debounceMs: number,
): Promise<PagefindResult[] | null> {
  const pagefind = await loadPagefind();
  const response = await pagefind.debouncedSearch(query, {}, debounceMs);
  return response?.results ?? null;
}

/** 結果配列の一部を表示用データに変換する */
async function sliceResults(
  results: PagefindResult[],
  offset: number,
  limit: number,
): Promise<PagefindSearchResult> {
  const page = results.slice(offset, offset + limit);
  return {
    total: results.length,
    entries: await Promise.all(page.map((result) => result.data())),
    hasMore: offset + page.length < results.length,
  };
}

export async function warmPagefind(query = ""): Promise<void> {
  const pagefind = await loadPagefind();
  if (query && pagefind.preload) {
    await pagefind.preload(query);
    return;
  }
  await pagefind.init?.();
}

/**
 * 先頭から `limit` 件を検索する。結果はキャッシュし、
 * `loadMorePagefind` で続きを取得できるようにする。
 */
export async function searchPagefind(
  query: string,
  limit: number,
  debounceMs = 300,
): Promise<PagefindSearchResult | null> {
  const results = await requestResults(query, debounceMs);
  if (!results) {
    cachedSearch = undefined;
    return null;
  }

  cachedSearch = { query, results };
  return sliceResults(results, 0, limit);
}

/**
 * `searchPagefind` の続きを取得する。
 * 同じクエリなら検索をやり直さずキャッシュを使う。
 */
export async function loadMorePagefind(
  query: string,
  offset: number,
  limit: number,
): Promise<PagefindSearchResult | null> {
  const results =
    cachedSearch?.query === query
      ? cachedSearch.results
      : await requestResults(query, 0);

  if (!results) return null;
  cachedSearch = { query, results };
  return sliceResults(results, offset, limit);
}
