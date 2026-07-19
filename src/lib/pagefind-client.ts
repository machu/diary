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
  total: number;
  entries: PagefindData[];
}

let pagefindPromise: Promise<PagefindApi> | undefined;

function loadPagefind(): Promise<PagefindApi> {
  const pagefindUrl = "/pagefind/pagefind.js";
  pagefindPromise ??= import(/* @vite-ignore */ pagefindUrl).then(
    (module) => module as PagefindApi,
  );
  return pagefindPromise;
}

export async function warmPagefind(query = ""): Promise<void> {
  const pagefind = await loadPagefind();
  if (query && pagefind.preload) {
    await pagefind.preload(query);
    return;
  }
  await pagefind.init?.();
}

export async function searchPagefind(
  query: string,
  limit: number,
  debounceMs = 300,
): Promise<PagefindSearchResult | null> {
  const pagefind = await loadPagefind();
  const response = await pagefind.debouncedSearch(query, {}, debounceMs);
  if (!response) return null;

  const visible = response.results.slice(0, limit);
  return {
    total: response.results.length,
    entries: await Promise.all(visible.map((result) => result.data())),
  };
}
