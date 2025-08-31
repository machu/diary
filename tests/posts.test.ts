import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal fake PostEntry
type Post = { slug: string; data: { date: Date; draft?: boolean; tags?: string[] } };

const samplePosts: Post[] = [
  { slug: '2025/20250101p01', data: { date: new Date('2025-01-01'), draft: false, tags: ['life'] } },
  { slug: '2025/20250102p01', data: { date: new Date('2025-01-02'), draft: true, tags: ['tech'] } },
  { slug: '2025/20250103p01', data: { date: new Date('2025-01-03'), draft: false, tags: ['Tech'] } },
];

// Provide a mock for astro:content that respects a filter predicate
function mockGetCollection() {
  vi.mock('astro:content', () => ({
    getCollection: async (_name: string, filter?: (p: any) => boolean) => {
      const arr = [...samplePosts];
      return filter ? arr.filter((p) => filter(p)) : arr;
    },
  }));
}

describe('getAllPosts()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('excludes drafts by default unless includeDrafts is true', async () => {
    mockGetCollection();
    const { getAllPosts } = await import('@/lib/posts');

    // Explicitly exclude drafts
    const nonDrafts = await getAllPosts({ includeDrafts: false });
    expect(nonDrafts.map((p) => p.slug)).toEqual([
      '2025/20250101p01',
      '2025/20250103p01',
    ]);

    // Include drafts
    const withDrafts = await getAllPosts({ includeDrafts: true });
    expect(withDrafts.map((p) => p.slug)).toEqual([
      '2025/20250101p01',
      '2025/20250102p01',
      '2025/20250103p01',
    ]);
  });

  it('applies an additional predicate when provided (e.g., tag filtering)', async () => {
    mockGetCollection();
    const { getAllPosts } = await import('@/lib/posts');

    // Case-insensitive tag filter using provided predicate
    const techOnly = await getAllPosts({
      includeDrafts: true,
      predicate: (p) => (p.data.tags || []).some((t) => t.toLowerCase() === 'tech'),
    });
    expect(techOnly.map((p) => p.slug)).toEqual([
      '2025/20250102p01',
      '2025/20250103p01',
    ]);
  });
});
