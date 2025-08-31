import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

/**
 * Fetch all posts with consistent draft filtering.
 * - Drafts are included only in dev by default.
 * - Optional predicate allows extra filtering (e.g., by tag).
 */
export async function getAllPosts(options?: {
  includeDrafts?: boolean;
  predicate?: (p: PostEntry) => boolean;
}): Promise<PostEntry[]> {
  const includeDrafts = options?.includeDrafts ?? import.meta.env.DEV;
  const pred = options?.predicate;
  return getCollection(
    "posts",
    (p) => (includeDrafts || !p.data.draft) && (pred ? pred(p) : true)
  );
}

