まちゅダイアリー - Astroブログプロジェクト

tDiaryで書いた日記をAstroにコンバートし、静的サイトとして配信します。2003年から現在までの20年以上のアーカイブを扱います。

## 技術スタック

- フレームワーク: Astro v7.1
- 言語: TypeScript
- UI: Astroコンポーネント
- スタイリング: Tailwind CSS
- 画像処理: Sharp
- サイト内検索: Pagefind
- ビルドツール: Vite

## 開発環境

- Node.js: v22.x（`.nvmrc` 参照）
- パッケージマネージャー: pnpm

## ディレクトリ構造

```
/
├── src/
│   ├── content.config.ts      # Content Layerコレクション定義
│   ├── content/
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
│   │   ├── search.astro                  # Pagefind全文検索
│   │   ├── years/index.astro             # 年別一覧
│   │   └── years/[year].astro            # 年内の日別＋エントリ一覧
│   ├── components/            # UIコンポーネント
│   ├── layouts/               # レイアウトテンプレート
│   └── lib/
│       ├── dates.ts           # 日付/URLヘルパー
│       ├── related-posts.ts   # 本文類似度による関連記事を事前計算
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
- サイト内検索: `/search?q=キーワード`
- 年別一覧: `/years`（年ごとの件数）
- 年詳細: `/years/YYYY`（日付ごとに、当日のエントリ名とタグを表示）

### 旧URLからのリダイレクト

- 旧URL: `/diary/YYYYMMDD.html`
- 振り分け:
  - 同日に1件のみ → `/posts/YYYYMMDD/pNN` へ 301
  - 複数件あり → `/posts/YYYYMMDD/` へ 301
  - インデックス `/diary/` → `/` へ 301（トップへ）

実装

- ルート: `src/pages/diary/[date].html.ts`
- 動作: 全投稿から日付（YYYYMMDD）ごとに静的生成し、当日の件数に応じて 301 で新URLへリダイレクトします。該当日がない場合は 404 を返します。
- 備考: 新URLのスラグは不変（`/posts/YYYYMMDD/` と `/posts/YYYYMMDD/pNN`）。

追加

- `/diary/` 直下アクセス時はサイトトップ `/` へ 301 リダイレクトします。
- ルート: `src/pages/diary/index.html.ts`

## コンテンツ構造（frontmatter）

```yaml
---
title: 記事タイトル
date: "YYYY-MM-DD"
lastmod: "YYYY-MM-DD" # 任意
draft: false # 任意
tags: [タグ1, タグ2] # 任意
description: 記事の説明 # 任意
image: 画像パス # 任意
---
```

命名規則: `YYYYMMDDpNN.md`（例: `20240707p01.md`）

### ドラフトの扱い

- `draft: true` を指定した投稿は、開発サーバー（`pnpm dev`）では表示されますが、本番ビルド（`pnpm build`）には含まれません。
- 実装: `src/lib/posts.ts` の `getAllPosts()` が `import.meta.env.DEV` を用いて一括フィルタします（各ページはこのヘルパーを利用）。

## サイト内検索と関連記事

実装の詳細は[`docs/search-and-related-posts.md`](docs/search-and-related-posts.md)を参照してください。

- `pnpm build`のAstroビルド後にPagefindが生成HTMLを索引化します。
- 記事本文全体を対象にし、日本語の分かち書きに対応した静的検索を`/search`で提供します。
- 検索フォームはヘッダーと検索ページにあり、`?q=`付きURLを共有できます。
- `pnpm dev`では、直前の`pnpm build`が生成した`dist/pagefind`を配信します。初回とコンテンツ更新後は`pnpm build`を実行してから開発サーバーを再起動してください。
- 記事下部の「関連記事」は、タイトルとMarkdown本文を日本語の単語単位に分割し、TF-IDFコサイン類似度が高い順に最大3件表示します。フロントマターのタグはランキングに使いません。
- 多くの記事に現れる一般語、自分自身、同日エントリは候補から除外します。同点時は投稿日が近い記事を優先し、候補がない場合はその旨を表示します。
- 関連候補と前後記事は`getStaticPaths()`で一度だけ計算し、各記事ページの生成時に渡します。

## ビルド・開発コマンド（pnpm）

```
pnpm install      # 依存関係のインストール（必要なら pnpm approve-builds で esbuild/sharp を承認）
pnpm dev          # 開発サーバー起動
pnpm build        # 型チェック → Astroビルド → Pagefind索引生成
pnpm run build:search # 生成済みdistからPagefind索引だけを再生成
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
  - フロントマター初期値: `title: 'YYYY-MM-DDの日記'`, `date: "YYYY-MM-DD"`, `tags: []`, `draft: true`
  - 生成後に `code -r <ファイルパス>` を実行して VS Code で開きます（`code` コマンドが無い場合は警告してスキップ）

## コーディング規約

- フォーマット: Prettier（`prettier-plugin-astro`, `prettier-plugin-tailwindcss`）
- Lint: ESLint v9（`eslint-plugin-astro`, `eslint-plugin-tailwindcss`）
- 型: TypeScript（厳格設定）
- インポート: `@/` エイリアスを優先（`tsconfig.json`, `astro.config.mjs`）
- 命名: AstroはPascalCase（例: `Header.astro`）、ユーティリティはlowerCamelCase、投稿は `YYYYMMDDpNN` セグメント

## 画像最適化

- Astro 7 のレスポンシブ画像機能と Sharp により、Markdown画像を最適化します。
- `astro.config.mjs` で `layout: "constrained"` と `responsiveStyles: true` を設定しています。

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
  - Vercel Preview: redirects が旧 URL に対して実際に 301 と正しい `Location` を返すことを確認。

### ビルド出力検証と E2E

`pnpm test:output`は、生成済みの`dist/**/*.html`を対象に日付表記、タグの小文字URL、ページネーション、検索メタデータ、関連記事、旧URLの転送先、`vercel.mjs`が生成する301ルールを検証します。

```bash
pnpm build
pnpm test:output
pnpm test:e2e
pnpm test:e2e:dev
```

`pnpm test:e2e` は Chromium と `astro preview` を使い、トップから記事、ページ送り、タグ遷移、全文検索、モバイル検索フォーム、旧 URL の代表的な導線を確認します。初回のみ `pnpm exec playwright install chromium` でブラウザをインストールしてください。

`pnpm test:e2e:dev`は、`pnpm build`で生成済みのPagefind索引を`astro dev`から検索できることと、本文ベースの関連記事を確認します。

ユニットテスト、Lint、ビルド、成果物テスト、E2E をまとめて実行する場合は次を使います。

```bash
pnpm verify
```

静的な`astro preview`は旧URLをmeta refreshのHTMLとして`200 OK`で返します。本番のHTTP 301はVercelの通常redirectsが担当します。`vercel.mjs`は公開対象のMarkdownからルールを動的生成し、`draft: true`を除外します。Vercel Previewのデプロイ後、次のコマンドで代表URLのステータスと`Location`を確認できます。

```bash
pnpm test:redirects -- https://example.vercel.app
```

設計と制約の詳細は `docs/build-output-verification-plan.md` を参照してください。

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

- 画像: Sharp のビルド許可と、外部画像ドメインの設定を変更する際は生成結果を確認する。
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
