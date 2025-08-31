まちゅダイアリー - Astroブログプロジェクト

tDiaryで書いた日記をAstroにコンバートし、静的サイトとして配信します。2003年から現在までの20年以上のアーカイブを扱います。

## 技術スタック

- フレームワーク: Astro v5
- 言語: TypeScript
- UI: React（コンポーネント用）
- スタイリング: Tailwind CSS
- 画像処理: Sharp
- ビルドツール: Vite

## 開発環境

- Node.js: v22.x（`.nvmrc` 参照）
- パッケージマネージャー: pnpm

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
│   │   ├── tags/[tag].astro              # タグ別一覧
│   │   ├── years/index.astro             # 年別一覧
│   │   └── years/[year].astro            # 年内の日別＋エントリ一覧
│   ├── components/            # UIコンポーネント
│   ├── layouts/               # レイアウトテンプレート
│   └── lib/
│       ├── dates.ts           # 日付/URLヘルパー
│       ├── tags.ts            # タグ正規化ヘルパー（小文字化）
│       └── posts.ts           # 投稿取得ヘルパー（draftフィルタ共通化）
├── public/                    # 静的アセット
└── astro.config.mjs           # Astro設定
```

## ページとURL

- トップページ: 最新の日記をページネーション表示（30件/ページ）。`/` が1ページ目、`/2`, `/3`, ...
- 日付ページ: `/posts/YYYYMMDD/`（同日のエントリを一覧表示）
- エントリページ: `/posts/YYYYMMDD/pNN`（Markdown本文を表示）
- タグ一覧: `/tags`
- タグ詳細: `/tags/:tag`（タグは小文字スラグ）
- 年別一覧: `/years`（年ごとの件数）
- 年詳細: `/years/YYYY`（日付ごとに、当日のエントリ名とタグを表示）

### 旧URLからのリダイレクト

- 旧URL: `/diary/YYYYMMDD.html`
- 振り分け:
  - 同日に1件のみ → `/posts/YYYYMMDD/pNN` へ 301
  - 複数件あり → `/posts/YYYYMMDD/` へ 301

実装

- ルート: `src/pages/diary/[date].html.ts`
- 動作: 全投稿から日付（YYYYMMDD）ごとに静的生成し、当日の件数に応じて 301 で新URLへリダイレクトします。該当日がない場合は 404 を返します。
- 備考: 新URLのスラグは不変（`/posts/YYYYMMDD/` と `/posts/YYYYMMDD/pNN`）。

## コンテンツ構造（frontmatter）

```yaml
---
title: 記事タイトル
date: "YYYY-MM-DD"
lastmod: "YYYY-MM-DD" # 任意
draft: false          # 任意
tags: [タグ1, タグ2]  # 任意
description: 記事の説明 # 任意
image: 画像パス        # 任意
---
```

命名規則: `YYYYMMDDpNN.md`（例: `20240707p01.md`）

### ドラフトの扱い

- `draft: true` を指定した投稿は、開発サーバー（`pnpm dev`）では表示されますが、本番ビルド（`pnpm build`）には含まれません。
- 実装: `src/lib/posts.ts` の `getAllPosts()` が `import.meta.env.DEV` を用いて一括フィルタします（各ページはこのヘルパーを利用）。

## ビルド・開発コマンド（pnpm）

```
pnpm install      # 依存関係のインストール（必要なら pnpm approve-builds で esbuild/sharp を承認）
pnpm dev          # 開発サーバー起動
pnpm build        # 型チェック（astro check）→ 本番ビルド
pnpm preview      # 本番ビルドのローカルプレビュー
pnpm lint         # ESLint（Astro/TS/Tailwind）
```

## 日記の作成（CLI）

- 今日のテンプレを作成し、VS Code で開く:

```
pnpm run diary
```

- 任意の日付で作成（`YYYY-MM-DD` or `YYYY/MM/DD`）:

```
pnpm run diary -- 2025-09-01
```

- 仕様:
  - 生成先: `src/content/posts/YYYY/`
  - ファイル名: `YYYYMMDDpNN.md`（同日に複数ある場合は `pNN` を自動インクリメント）
  - フロントマター初期値: `title: ""`, `date: "YYYY-MM-DD"`, `description: ""`, `tags: []`, `draft: true`
  - 生成後に `code -r <ファイルパス>` を実行して VS Code で開きます（`code` コマンドが無い場合は警告してスキップ）


## コーディング規約

- フォーマット: Prettier（`prettier-plugin-astro`, `prettier-plugin-tailwindcss`）
- Lint: ESLint v9（`eslint-plugin-astro`, `eslint-plugin-tailwindcss`）
- 型: TypeScript（厳格設定）
- インポート: `@/` エイリアスを優先（`tsconfig.json`, `astro.config.mjs`）
- 命名: AstroはPascalCase（例: `Header.astro`）、Reactコンポーネントはlower-caseファイル名（例: `button.tsx`）、ユーティリティはlowerCamelCase、投稿は `YYYYMMDDpNN` セグメント

## 画像最適化

- Astro 5.9+ の `experimental.responsiveImages` でMarkdown画像の自動最適化を想定（WebP変換・lazy・レスポンシブ・外部画像対応）。
- 現状の設定では 404 回避のため image service を `noop` に設定しています（`astro.config.mjs`）。最適化を有効化する場合は image service の見直しと experimental フラグの適用を検討してください。

## テストと実装方針

- ユニットテストは Vitest を使用。新規ロジックは `src/lib` に純粋関数として切り出し、テストしやすくします。
- コンテンツ（Markdown）の変更と振る舞い（コード）変更は分けてコミット。

## テスト戦略 / 実装状況

- 方針: ユニット（高速）→ ビルド出力検証 → 必要最小限のE2E。
- ツール: Vitest（ユニット/結合）、必要に応じて Playwright（E2E）。
- 実装済み（ユニット）:
  - タグ正規化: `tests/tags.test.ts`（`normalizeTag`, `equalsTag`）。
  - 旧URLリダイレクト: `tests/redirect.test.ts`（単一/複数/未存在の分岐、`getStaticPaths`）。
    - `astro:content` をモックし、`getCollection` を制御して検証。
- 設定: `vitest.config.ts`（`@/` エイリアス解決済み、Node環境、mocksリセット）。
- 実行: `pnpm test`（CI想定）。
- 次段階（案）:
  - ビルド出力検証: `pnpm build` 後に `dist/**/*.html` をパースして日付表記、タグ小文字リンク、ページネーションを確認。
  - E2E: `/diary/YYYYMMDD.html` の 301 と Location、トップ→エントリ、タグバッジの遷移などハッピーパスのみ。

## コミット/PR 指針

- コミット: 簡潔・現在形・スコープ限定（例: `Astroを5.13.3へアップデート`, `タグの大文字小文字を正規化`）
- PR: 概要・関連Issue・必要ならUIスクショを添付。`pnpm lint` と `pnpm build` を通すこと。コンテンツ移行やエイリアス変更があれば説明。

### ブランチ運用

- 既定ブランチは `master` です（旧 `main` からリネーム済み）。
- 既存のローカルで `main` を利用している場合は以下で切替可能です。

```
git fetch origin
git branch -m main master
git branch -u origin/master master
git remote set-head origin -a
```

## セキュリティ/設定の注意

- 画像: image service `noop` は暫定措置。最適化を有効にする場合はサービス設定を必ず見直す。
- パス: 深い相対パスより`@/`エイリアスを優先し、将来の移動に強くする。

## OGP（Open Graph / Twitter Cards）

- すべてのページで OGP/Twitter のメタタグを出力（`src/layouts/BaseLayout.astro`）。
- 既定値:
  - `og:site_name`: まちゅダイアリー
  - `og:type`: 一覧・インデックスは `website`、記事詳細は `article`
  - 画像未指定時は `/avatar.jpg` を利用
- URLの絶対化（`og:url` と画像の絶対URL）には環境変数 `PUBLIC_SITE_URL` を使用します。
  - 例: `.env` に `PUBLIC_SITE_URL=https://www.example.com` を設定
  - 未設定時は開発中は `http://localhost` ベースになります。本番でのSNSプレビュー安定化のため、絶対URLの設定を推奨します。

## 表示ルール（UI）

- 日付の表示形式: 画面表示は `YYYY-MM-DD`、URLは `YYYYMMDD` を維持。
- 一覧（トップ / タグ詳細 / 日付ページ）: タイトルの右端にタグバッジを横並びで表示。タイトルにのみ hover 下線、タグバッジではタイトルに下線が付かない。
- 年詳細（`/years/YYYY`）: 日付見出しは `YYYY-MM-DD`。各エントリはタイトルの右端にタグバッジ表示。
- エントリ（`/posts/YYYYMMDD/pNN`）: タイトル直下にタグバッジ、次行に日付を表示。
- タグ一覧（`/tags`）: 段組レイアウト（`columns-2` 〜 `md:columns-4`）でバッジ表示。各タグ名の右に件数の小バッジを表示。

## タグの正規化（大小区別なし）

- 目的: Life と life のような表記揺れを同一タグとして扱う。
- ルール: `trim().toLowerCase()` により小文字に正規化。
- 実装: `src/lib/tags.ts` の `normalizeTag()` を使用し、
  - パス生成（`/tags/:tag`）は小文字スラグのみを出力
  - タグ一覧の件数は大小を合算
  - タグ詳細の絞り込みも正規化して比較
  - どのページでもタグリンクは小文字スラグに統一

## デモURL / スクリーンショット

- デモURL: https://example.com （公開先が決まり次第更新）
- スクリーンショット配置先: `docs/screenshots/`
- 取得手順: `pnpm build && pnpm preview` でローカル起動 → ブラウザで撮影。ライト/ダーク両テーマがあると親切です。

使用例（相対パスで参照）:

```
![トップページ](docs/screenshots/home.png)
![日付ページ](docs/screenshots/date.png)
![エントリページ](docs/screenshots/entry.png)
![タグ一覧](docs/screenshots/tags.png)
![年別アーカイブ](docs/screenshots/years.png)
```
