import { describe, it, expect } from 'vitest';
import { normalizeTag, equalsTag } from '@/lib/tags';

describe('tags normalization', () => {
  it('trims and lowercases', () => {
    expect(normalizeTag(' Life ')).toBe('life');
    expect(normalizeTag('\tLIFE\n')).toBe('life');
  });

  it('treats different cases as equal', () => {
    expect(equalsTag('Life', 'life')).toBe(true);
    expect(equalsTag('LifE', 'LIFE')).toBe(true);
  });
});

