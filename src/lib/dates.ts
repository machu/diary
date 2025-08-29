export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function toDisplayDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ymdToDisplay(ymd: string): string {
  // Expecting YYYYMMDD (8 chars)
  if (ymd.length !== 8) return ymd;
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

// Entry helpers
export function getPartFromSlug(slug: string): string {
  // slug like "20040927p03" -> "p03"
  const base = slug.split("/").pop() ?? slug;
  return base.slice(8);
}

export function buildEntryUrl(date: Date, slug: string): string {
  const ymd = toYmd(date);
  const part = getPartFromSlug(slug);
  return `/posts/${ymd}/${part}`;
}

export interface DatedEntry {
  slug: string;
  data: { date: Date } & Record<string, unknown>;
}

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

