# Astro 7 アップグレード戦略

## 目的

まちゅダイアリーを Astro 5 から Astro 7.1 系へ移行する。2,789 ページの静的出力、旧 tDiary URL の 301 リダイレクト、既存のタグ・年別・日付別 URL、1,500 件を超える過去記事の表示を維持しながら、段階的に互換性問題を解消する。

## 実施状況

- 2026-07-19: 段階 1〜3 を完了し、Astro 7.1.1 へ更新した。
- Content Layer API、Node.js/pnpm要件、Tailwind CSS、Markdown互換設定を反映済み。
- 2026-07-20: 段階 4のSätteriへの切り替えと`compressHTML: true`の削除を実施した。JSX空白規則の生成HTML比較は完了し、PC・モバイルのブラウザ目視のみ残っている。

## 基本方針

- Astro 5 から 7 へ一括更新せず、互換性の境界ごとに変更を分ける。
- 最大の変更点である Content Collections の移行を Astro 5 上で先に完了する。
- Astro 6 を独立した検証ゲートとして通過してから Astro 7 へ進む。
- Astro 7 導入時は Markdown と HTML 空白の従来挙動を一時的に維持し、フレームワーク更新と出力変更を分離する。
- TypeScript、ESLint、Vitest など、Astro 7 に必須でないメジャー更新は別作業にする。
- 各段階でユニットテスト、Lint、型チェック、本番ビルドを実行する。

## 現状と主なリスク

### Content Collections

現在は次の旧 API を利用している。

- `src/content/config.ts`
- `type: "content"`
- loader なしのコレクション
- `entry.slug`
- `entry.render()`

Astro 6 では旧 Content Collections API が削除されるため、最初に Content Layer API へ移行する。

### Markdown と過去記事

Astro 7 は既定の Markdown 処理系を unified/remark から Sätteri へ変更する。過去記事には HTML やコード例が多数含まれるため、Astro 7 導入時は `@astrojs/markdown-remark` の `unified()` processor を明示して従来の出力を維持する。Sätteri への切り替えは、Astro 7 で安定稼働した後の独立した作業とする。

### HTML コンパイラと空白

Astro 7 の Rust コンパイラは不正な HTML に従来より厳格である。また、`compressHTML` の既定値が JSX 方式へ変わる。初回移行では `compressHTML: true` を設定し、空白規則の変更を保留する。

### Vite と Tailwind CSS

Astro 7 は Vite 8 を使用する。現在の `@tailwindcss/vite@4.1` は Vite 8 を peer dependency に含まないため、Astro 7 移行時に Tailwind CSS と `@tailwindcss/vite` を 4.3 系へ更新する。

### Node.js

Astro 6 と 7 は Node.js 22.12.0 以上を必要とする。`package.json` の Volta 設定は Node.js 22.19.0 なので要件を満たす。`.nvmrc` と `engines` を追加し、ローカルと Vercel の実行環境を揃える。

## 実施段階

### 段階 1: Astro 5.18 と Content Layer API

1. Astro を v5 最終系列の 5.18 へ更新する。
2. `src/content/config.ts` を `src/content.config.ts` へ移動する。
3. `glob()` loader を追加し、`src/content/posts/**/*.md` を読み込む。
4. `type: "content"` を削除する。
5. Zod を `astro/zod` から読み込む。
6. `entry.slug` を `entry.id` へ置き換える。
7. `entry.render()` を `render(entry)` へ置き換える。
8. URL ヘルパーとテストフィクスチャを entry ID に合わせる。
9. URL、投稿順、ドラフト除外が変わらないことを検証する。

この段階では `legacy.collectionsBackwardsCompat` を使用しない。

### 段階 2: Astro 6

1. Astro を 6.4 系へ更新する。
2. `.nvmrc`、`engines.node`、`packageManager` を設定する。
3. Node.js 22.19.0 で依存関係を再生成する。
4. Vite 7、Zod 4、Shiki 4 の影響を確認する。
5. Vercel Preview で静的サイトを確認する。

### 段階 3: Astro 7.1

1. Astro を 7.1 系へ更新する。
2. Tailwind CSS と `@tailwindcss/vite` を 4.3 系へ更新する。
3. `@astrojs/markdown-remark` を直接依存として追加する。
4. `markdown.processor: unified()` を指定する。
5. `compressHTML: true` を指定する。
6. Rust コンパイラで検出される HTML 構文を修正する。
7. Vite 8/Rolldown で開発サーバーと本番ビルドを検証する。

### 段階 4: Astro 7 ネイティブ挙動

Astro 7 の安定稼働後に別変更として実施する。

1. `unified()` processor を外し、Sätteri へ切り替える。
2. 代表的な新旧記事の HTML 差分を確認する。
3. 問題がなければ `@astrojs/markdown-remark` を削除する。
4. `compressHTML: true` を外し、JSX 空白規則へ切り替える。
5. ビルド時間、生成物サイズ、表示差分を記録する。

## 検証項目

各段階で以下を実行する。

```bash
pnpm test
pnpm lint
pnpm build
```

加えて次を確認する。

- 生成ページ数とルート一覧
- `/diary/YYYYMMDD.html` の 301 と `Location`
- `/posts/YYYYMMDD/pNN` の互換性
- タグ URL の小文字正規化
- トップページのページネーション
- 年別・月別グルーピング
- 最新記事と古い HTML を含む代表記事の本文
- ライト・ダークテーマ
- モバイルとデスクトップのレイアウト
- ビルド時間と `dist` サイズ

## 依存関係の扱い

Astro 7 移行と同時に更新するのは、互換性上必要なものに限定する。

- Astro
- `@astrojs/check`
- `@astrojs/markdown-remark`
- Tailwind CSS
- `@tailwindcss/vite`

次は別作業とする。

- TypeScript 7
- ESLint 10
- Vitest の追加更新
- Prettier の追加更新
- Sharp の追加更新

## 未マージ PR の扱い

PR #6「全文検索ページ + 関連記事コンポーネント」は `entry.slug` を追加で使用しているため、アップグレード中は保留する。Content Layer と Astro 7 の移行後に rebase し、`entry.id` と新しいテスト方針へ合わせる。

## 参考資料

- [Upgrade to Astro v6](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Astro 7.0 release](https://astro.build/blog/astro-7/)
- [Astro 7.1 release](https://astro.build/blog/astro-710/)
