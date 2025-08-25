export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function equalsTag(a: string, b: string): boolean {
  return normalizeTag(a) === normalizeTag(b);
}

