# まちゅダイアリー - Astroブログプロジェクト

## プロジェクト概要

このプロジェクトは、tDiaryで書かれた日記をAstroを使って静的なWebサイトとして表示するブログシステムです。2003年から現在まで20年以上にわたる日記データを管理しています。

## 技術スタック

- **フレームワーク**: Astro v5
- **言語**: TypeScript
- **UIライブラリ**: React（コンポーネント用）
- **スタイリング**: Tailwind CSS
- **画像処理**: Sharp
- **ビルドツール**: Vite

## 開発環境

- **Node.js**: v22.x（`.nvmrc` 参照）
- **パッケージマネージャー**: pnpm

## ディレクトリ構造

```
/
├── src/
│   ├── content/
│   │   ├── config.ts          # コンテンツコレクション定義
│   │   └── posts/             # 日記エントリ（年別に整理）
│   │       ├── 2003/
│   │       ├── 2004/
│   │       └── ...
│   ├── pages/                 # ルーティング
│   │   ├── [...page].astro                # トップ（ページネーション）
│   │   ├── posts/[date].astro            # 日付別一覧（/posts/YYYYMMDD/）
│   │   ├── posts/[date]/[part].astro     # 単一エントリ（/posts/YYYYMMDD/pNN）
│   │   ├── tags/index.astro              # タグ一覧
│   │   ├── tags/[tag].astro              # タグ別一覧（小文字スラグ）
│   │   ├── years/index.astro             # 年別一覧
│   │   └── years/[year].astro            # 年内の日別＋エントリ一覧
│   ├── components/            # UIコンポーネント
│   ├── layouts/               # レイアウトテンプレート
│   └── lib/                   # ヘルパー群
│       └── tags.ts            # タグの正規化（小文字化）
├── public/                    # 静的アセット
└── astro.config.mjs          # Astro設定
```

## 主要機能

1. **トップページ**: 最新の日記をページネーション表示（30件/ページ）
2. **日付別ページ**: 特定の日の全エントリを表示
3. **タグ機能**: タグによる記事の分類と一覧表示
4. **ダークモード**: テーマ切り替え機能
5. **レスポンシブデザイン**: モバイル対応

## コンテンツ構造

各日記エントリは以下のフロントマターを持つMarkdownファイル：

```yaml
---
title: 記事タイトル
date: "YYYY-MM-DD"
description: 記事の説明（オプション）
tags: [タグ1, タグ2]（オプション）
image: 画像パス（オプション）
---
```

## ビルド・開発コマンド

※npmではなくpnpmを使って下さい

```bash
pnpm dev      # 開発サーバー起動
pnpm build    # 本番ビルド（型チェック含む）
pnpm preview  # ビルドプレビュー
pnpm lint     # ESLintチェック
```

## URL構造とリダイレクト

- 旧URL: `/diary/YYYYMMDD.html`
- 新URL: `/posts/YYYYMMDD/` または `/posts/YYYYMMDD/pNN`

同じ日に複数エントリがある場合は日付ページへ、単一エントリの場合は直接そのエントリへリダイレクトします。

### 旧URLからの301リダイレクト（実装）

- ルート: `src/pages/diary/[date].html.ts`
- 生成: すべての投稿から `YYYYMMDD` を抽出して静的パスを生成。
- 振る舞い:
  - 同日が1件: `/posts/YYYYMMDD/pNN` へ 301
  - 同日が複数: `/posts/YYYYMMDD/` へ 301
  - 見つからない: 404
- 備考: 新URLのスラグは `YYYYMMDD` を保持（表示は `YYYY-MM-DD`）。

### タグの大小無視

- タグのURLは小文字スラグ（例: `/tags/life`）。
- 集計・絞り込みは `normalizeTag()`（`trim().toLowerCase()`）で正規化して比較。

## 画像最適化
Astro 5.9の`experimental.responsiveImages`機能により、Markdown内の画像が自動的に最適化されます：
- **WebP変換**: 自動的にWebP形式に変換して配信
- **Lazy Loading**: `loading="lazy"`が自動追加
- **レスポンシブ対応**: 適切なサイズでの配信
- **外部画像対応**: Flickr等の外部画像もサポート

## 開発時の注意事項

- TypeScriptの型チェックを必ず実行してください
- pnpmパッケージマネージャーを使用してください
- 日記ファイルの命名規則: `YYYYMMDDpNN.md`（例: 20240707p01.md）

## 表示ルール（UI）

- 日付の表示は `YYYY-MM-DD`。URLは `YYYYMMDD` を維持。
- 一覧（トップ / タグ詳細 / 日付ページ）は、タイトルの右側にタグバッジ（同一行末尾）。タイトルのみ hover で下線、タグにホバーしてもタイトルは反応しない。
- 年詳細は、日付見出しを `YYYY-MM-DD`、各エントリはタイトル右端にタグバッジ。
- タグ一覧は段組（`columns-2`〜）でバッジ表示し件数を併記。

## Build, Test, and Development Commands
- `pnpm install` — install dependencies (Node `v22.x`; see `.nvmrc`).
- `pnpm dev` (or `pnpm start`) — run the Astro dev server.
- `pnpm build` — type-check (`astro check`) then build the static site.
- `pnpm preview` — serve the production build locally.
- `pnpm lint` — run ESLint for Astro/TS/Tailwind.

## Coding Style & Naming Conventions
- Languages: Astro, TypeScript, React (TSX), Tailwind CSS.
- Formatting: Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss` (2-space indent). Commit formatted code.
- Linting: ESLint with `eslint-plugin-astro` and Tailwind plugin; Tailwind class order rule is disabled.
- Naming: Astro components in PascalCase (`Header.astro`); React UI files follow upstream lower-case style (`button.tsx`, `dropdown-menu.tsx`). Utilities use lowerCamelCase. Posts use `YYYYMMDDpNN` segments.

## Testing Guidelines
- No automated tests yet. For new logic, place pure helpers in `src/lib` and consider adding Vitest later. Keep content-only changes separate from behavior changes for easier review.

## Commit & Pull Request Guidelines
- Commits: concise, present-tense messages (Japanese is fine), focused scope. Examples: `Astroを5.13.3へアップデート`, `タグの大文字小文字を正規化`.
- PRs: include a summary, linked issues, and UI screenshots when relevant. Ensure `pnpm lint` and `pnpm build` pass. Describe any content migrations or alias changes.

## Security & Configuration Tips
- Images: `astro.config.mjs` sets the image service to `noop` to avoid 404s. Review before enabling optimization.
- Paths: Prefer the `@/` alias over deep relative imports to keep moves safe.
