import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock astro:content to control getCollection()
const mockEntries = () => [
  // single entry day (20040106)
  { slug: '2004/20040106p01', data: { date: new Date('2004-01-06') } },
  // multi-entry day (20040107)
  { slug: '2004/20040107p01', data: { date: new Date('2004-01-07') } },
  { slug: '2004/20040107p02', data: { date: new Date('2004-01-07') } },
];

// Helper redirect that mimics Astro's redirect() helper by returning a Response
const makeRedirect = (base: string) => (location: string, status = 302) =>
  new Response(null, { status, headers: { Location: new URL(location, base).toString() } });

describe('legacy redirect /diary/YYYYMMDD.html', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('redirects to single entry when only one post exists that day', async () => {
    vi.mock('astro:content', () => ({
      getCollection: async () => mockEntries(),
    }));
    const mod = await import('@/pages/diary/[date].html.ts');
    const res = await mod.GET({
      params: { date: '20040106' },
      redirect: makeRedirect('https://example.test'),
    } as any);
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://example.test/posts/20040106/p01');
  });

  it('redirects to date page when multiple posts exist that day', async () => {
    vi.mock('astro:content', () => ({
      getCollection: async () => mockEntries(),
    }));
    const mod = await import('@/pages/diary/[date].html.ts');
    const res = await mod.GET({
      params: { date: '20040107' },
      redirect: makeRedirect('https://example.test'),
    } as any);
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://example.test/posts/20040107/');
  });

  it('returns 404 when date not found', async () => {
    vi.mock('astro:content', () => ({
      getCollection: async () => mockEntries(),
    }));
    const mod = await import('@/pages/diary/[date].html.ts');
    const res = await mod.GET({
      params: { date: '20990101' },
      redirect: makeRedirect('https://example.test'),
    } as any);
    expect(res.status).toBe(404);
  });

  it('getStaticPaths generates all legacy date paths', async () => {
    vi.mock('astro:content', () => ({
      getCollection: async () => mockEntries(),
    }));
    const mod = await import('@/pages/diary/[date].html.ts');
    const paths = await mod.getStaticPaths();
    const dates = new Set(paths.map((p: any) => p.params.date));
    expect(dates.has('20040106')).toBe(true);
    expect(dates.has('20040107')).toBe(true);
  });
});

describe('index redirect /diary/', () => {
  it('redirects to / (site root)', async () => {
    const mod = await import('@/pages/diary/index.ts');
    const res = await mod.GET({
      redirect: (location: string, status = 302) =>
        new Response(null, {
          status,
          headers: { Location: new URL(location, 'https://example.test').toString() },
        }),
    } as any);
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://example.test/');
  });
});
