import { describe, it, expect } from 'vitest';
import {
  toYmd,
  toDisplayDate,
  ymdToDisplay,
  getPartFromSlug,
  buildEntryUrl,
  groupByDateYmd,
  type DatedEntry,
} from '@/lib/dates';

describe('dates utilities', () => {
  const d = new Date('2025-01-02T12:34:56Z');

  it('toYmd formats as YYYYMMDD', () => {
    expect(toYmd(d)).toBe('20250102');
  });

  it('toDisplayDate formats as YYYY-MM-DD', () => {
    expect(toDisplayDate(d)).toBe('2025-01-02');
  });

  it('ymdToDisplay converts YYYYMMDD to YYYY-MM-DD and leaves invalid length unchanged', () => {
    expect(ymdToDisplay('20250102')).toBe('2025-01-02');
    expect(ymdToDisplay('202501')).toBe('202501');
  });

  it('getPartFromSlug extracts pNN from slug or path', () => {
    expect(getPartFromSlug('20040927p03')).toBe('p03');
    expect(getPartFromSlug('2004/20040927p07')).toBe('p07');
  });

  it('buildEntryUrl builds /posts/YYYYMMDD/pNN', () => {
    const url = buildEntryUrl(d, '2004/20040927p03');
    expect(url).toBe('/posts/20250102/p03');
  });

  it('groupByDateYmd groups entries by YYYYMMDD', () => {
    const entries: DatedEntry[] = [
      { slug: 'x/a', data: { date: new Date('2025-01-02') } },
      { slug: 'x/b', data: { date: new Date('2025-01-03') } },
      { slug: 'x/c', data: { date: new Date('2025-01-02') } },
    ];
    const map = groupByDateYmd(entries);
    expect([...map.keys()].sort()).toEqual(['20250102', '20250103']);
    expect(map.get('20250102')?.length).toBe(2);
    expect(map.get('20250103')?.length).toBe(1);
  });
});

