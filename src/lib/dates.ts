/**
 * Date -> YYYYMMDD 文字列に変換
 * 例: 2024-07-01 -> "20240701"
 */
export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * Date -> 表示用 YYYY-MM-DD 文字列に変換
 * 例: 2024-07-01 -> "2024-07-01"
 */
export function toDisplayDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * YYYYMMDD -> 表示用 YYYY-MM-DD に変換
 * 不正な長さの入力はそのまま返す
 */
export function ymdToDisplay(ymd: string): string {
  // 想定入力: YYYYMMDD（8文字）
  if (ymd.length !== 8) return ymd;
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

// Entry 関連ヘルパー
/**
 * スラグから part（pNN）を取り出す
 * 例: "20040927p03" -> "p03"
 */
export function getPartFromSlug(slug: string): string {
  // slug like "20040927p03" -> "p03"
  const base = slug.split("/").pop() ?? slug;
  return base.slice(8);
}

/**
 * エントリ詳細のURLを生成
 * 例: date=2024-07-01, slug=...p02 -> "/posts/20240701/p02"
 */
export function buildEntryUrl(date: Date, slug: string): string {
  const ymd = toYmd(date);
  const part = getPartFromSlug(slug);
  return `/posts/${ymd}/${part}`;
}

/**
 * date プロパティを持つエントリの最小構造
 */
export interface DatedEntry {
  slug: string;
  data: { date: Date } & Record<string, unknown>;
}

/**
 * エントリ配列を YYYYMMDD キーでグルーピング
 * 戻り値: Map<YYYYMMDD, entries[]>
 */
export function groupByDateYmd<T extends DatedEntry>(entries: T[]): Map<string, T[]> {
  const byDate = new Map<string, T[]>();
  for (const e of entries) {
    const key = toYmd(e.data.date);
    const list = byDate.get(key) ?? [];
    list.push(e);
    byDate.set(key, list);
  }
  return byDate;
}

/**
 * Date -> YYYY-MM 文字列に変換
 */
export function toYm(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * エントリ配列を YYYY-MM キーでグルーピング
 * 戻り値: Map<YYYY-MM, entries[]>
 */
export function groupByMonth<T extends DatedEntry>(entries: T[]): Map<string, T[]> {
  const byMonth = new Map<string, T[]>();
  for (const e of entries) {
    const key = toYm(e.data.date);
    const list = byMonth.get(key) ?? [];
    list.push(e);
    byMonth.set(key, list);
  }
  return byMonth;
}
