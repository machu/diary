/**
 * タグを正規化（前後空白除去 + 小文字化）
 * URL スラグや比較用途に使用
 */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * タグの等価比較（正規化して比較）
 */
export function equalsTag(a: string, b: string): boolean {
  return normalizeTag(a) === normalizeTag(b);
}
