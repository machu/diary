import { toYmd } from "@/lib/dates";
import { mdToPlainText } from "@/lib/markdown";

export interface RelatedPostEntry {
  id: string;
  body?: string;
  data: {
    title: string;
    date: Date;
  };
}

interface WeightedDocument<T> {
  entry: T;
  weights: Map<string, number>;
  norm: number;
}

interface ScoredPost<T> {
  entry: T;
  score: number;
  dateDistance: number;
}

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

const stopWords = new Set([
  "あの",
  "ある",
  "いる",
  "から",
  "ここ",
  "こと",
  "これ",
  "さん",
  "した",
  "して",
  "する",
  "そこ",
  "その",
  "ため",
  "できる",
  "です",
  "では",
  "でも",
  "という",
  "として",
  "ところ",
  "なる",
  "ので",
  "まで",
  "ます",
  "また",
  "まだ",
  "もの",
  "もう",
  "よう",
  "より",
  "今日",
]);

function tokens(text: string): string[] {
  const normalized = text.normalize("NFKC").toLocaleLowerCase("ja");
  return [...segmenter.segment(normalized)]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment.trim())
    .filter(
      (token) =>
        token.length >= 2 &&
        !stopWords.has(token) &&
        !/^\p{Number}+$/u.test(token),
    );
}

function addTokens(
  counts: Map<string, number>,
  values: string[],
  weight: number,
) {
  for (const token of values) {
    counts.set(token, (counts.get(token) ?? 0) + weight);
  }
}

/**
 * タイトルと本文のTF-IDFコサイン類似度から、全投稿分の関連記事を計算する。
 *
 * - Intl.Segmenterで日本語を単語分割
 * - タイトルを本文より強く評価
 * - 多くの記事に現れる一般語を除外
 * - 自分自身と同日エントリは除外
 * - 同点なら投稿日が近い記事、新しい記事、IDの順で安定化
 */
export async function buildRelatedPostsMap<T extends RelatedPostEntry>(
  posts: T[],
  count = 3,
): Promise<Map<string, T[]>> {
  const result = new Map(posts.map((post) => [post.id, [] as T[]]));
  if (count <= 0 || posts.length === 0) return result;

  const termCounts = new Map<string, Map<string, number>>();
  const documentFrequency = new Map<string, number>();

  await Promise.all(
    posts.map(async (post) => {
      const counts = new Map<string, number>();
      const plainBody = post.body ? await mdToPlainText(post.body) : "";
      addTokens(counts, tokens(post.data.title), 3);
      addTokens(counts, tokens(plainBody), 1);
      termCounts.set(post.id, counts);

      for (const term of counts.keys()) {
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      }
    }),
  );

  const maxDocumentFrequency =
    posts.length < 20 ? posts.length : Math.ceil(posts.length * 0.2);
  const documents = new Map<string, WeightedDocument<T>>();
  const postings = new Map<string, Array<{ id: string; weight: number }>>();

  for (const post of posts) {
    const weights = new Map<string, number>();
    let squaredNorm = 0;

    for (const [term, frequency] of termCounts.get(post.id) ?? []) {
      const frequencyInDocuments = documentFrequency.get(term) ?? 0;
      if (frequencyInDocuments > maxDocumentFrequency) continue;

      const inverseDocumentFrequency =
        Math.log((posts.length + 1) / (frequencyInDocuments + 1)) + 1;
      const weight = (1 + Math.log(frequency)) * inverseDocumentFrequency;
      weights.set(term, weight);
      squaredNorm += weight * weight;

      const termPostings = postings.get(term) ?? [];
      termPostings.push({ id: post.id, weight });
      postings.set(term, termPostings);
    }

    documents.set(post.id, {
      entry: post,
      weights,
      norm: Math.sqrt(squaredNorm),
    });
  }

  for (const current of documents.values()) {
    if (current.norm === 0) continue;

    const dotProducts = new Map<string, number>();
    for (const [term, currentWeight] of current.weights) {
      for (const candidate of postings.get(term) ?? []) {
        if (candidate.id === current.entry.id) continue;
        dotProducts.set(
          candidate.id,
          (dotProducts.get(candidate.id) ?? 0) +
            currentWeight * candidate.weight,
        );
      }
    }

    const currentDate = current.entry.data.date.getTime();
    const currentYmd = toYmd(current.entry.data.date);
    const scored: ScoredPost<T>[] = [];

    for (const [candidateId, dotProduct] of dotProducts) {
      const candidate = documents.get(candidateId);
      if (!candidate || candidate.norm === 0) continue;
      if (toYmd(candidate.entry.data.date) === currentYmd) continue;

      scored.push({
        entry: candidate.entry,
        score: dotProduct / (current.norm * candidate.norm),
        dateDistance: Math.abs(
          candidate.entry.data.date.getTime() - currentDate,
        ),
      });
    }

    scored.sort(
      (a, b) =>
        b.score - a.score ||
        a.dateDistance - b.dateDistance ||
        b.entry.data.date.getTime() - a.entry.data.date.getTime() ||
        a.entry.id.localeCompare(b.entry.id),
    );
    result.set(
      current.entry.id,
      scored.slice(0, count).map(({ entry }) => entry),
    );
  }

  return result;
}
