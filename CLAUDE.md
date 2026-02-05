# まちゅダイアリー - Astroブログプロジェクト

## プロジェクト概要

このプロジェクトは、tDiaryで書かれた日記をAstroを使って静的なWebサイトとして表示するブログシステムです。2003年から現在まで20年以上にわたる日記データを管理しています。

## 技術スタック

- **フレームワーク**: Astro v5
- **言語**: TypeScript
- **UIコンポーネント**: Astro（.astroファイル）
- **スタイリング**: Tailwind CSS v4（Viteプラグイン経由）
- **画像処理**: Sharp
- **ビルドツール**: Vite
- **テスト**: Vitest

## 開発環境

- **Node.js**: v22.x（Volta で管理）
- **パッケージマネージャー**: pnpm（npmではなくpnpmを使用してください）

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
│   │   ├── years/[year].astro            # 年内の月別＋エントリ一覧
│   │   └── diary/[date].html.ts          # 旧URL 301リダイレクト
│   ├── components/            # UIコンポーネント
│   │   ├── Header.astro       # サイトヘッダー
│   │   ├── PostCard.astro     # 記事カード（全面リンク対応）
│   │   ├── RelatedPosts.astro # 関連記事（タグJaccard係数）
│   │   └── TagBadges.astro    # タグバッジ表示
│   ├── layouts/               # レイアウトテンプレート
│   │   └── BaseLayout.astro   # ベースレイアウト（OGP対応）
│   ├── lib/                   # ヘルパー群
│   │   ├── constants.ts       # 定数（PAGE_SIZE, EXCERPT_MAX）
│   │   ├── dates.ts           # 日付/URLユーティリティ
│   │   ├── markdown.ts        # Markdown→プレーンテキスト変換
│   │   ├── posts.ts           # 投稿取得（draftフィルタ共通化）
│   │   └── tags.ts            # タグの正規化（小文字化）
│   └── styles/
│       └── globals.css        # Tailwind CSS設定とカスタムCSS
├── scripts/
│   └── diary.js               # 日記作成スクリプト
├── tests/                     # テストファイル
├── public/                    # 静的アセット
├── astro.config.mjs           # Astro設定
├── tailwind.config.mjs        # Tailwind設定
├── vitest.config.ts           # Vitest設定
└── eslint.config.js           # ESLint設定
```

## 主要機能

1. **トップページ**: 最新の日記をページネーション表示（30件/ページ）
2. **日付別ページ**: 特定の日の全エントリを表示
3. **タグ機能**: タグによる記事の分類と一覧表示（小文字正規化）
4. **年別アーカイブ**: 年内の月別グルーピング表示
5. **ダークモード**: テーマ切り替え機能（`.dark`クラス）
6. **レスポンシブデザイン**: モバイル1列、タブレット2列、PC3列のカードグリッド
7. **サイト内検索**: クライアントサイド全文検索（ビルド時JSONインデックス生成）
8. **関連記事**: タグJaccard係数による類似記事表示

## コンテンツ構造

各日記エントリは以下のフロントマターを持つMarkdownファイル：

```yaml
---
title: 記事タイトル
date: "YYYY-MM-DD"
description: 記事の説明（オプション）
tags: [タグ1, タグ2]（オプション）
image: 画像パス（オプション、サムネイル用）
draft: true（オプション、下書き）
lastmod: "YYYY-MM-DD"（オプション、最終更新日）
---
```

### ドラフトの扱い

- `draft: true` の投稿は、開発時（`pnpm dev`）のみ表示され、本番ビルドでは除外されます。
- `src/lib/posts.ts` の `getAllPosts()` が `import.meta.env.DEV` を用いて共通的に制御します。

### 日記ファイルの命名規則

- 形式: `YYYYMMDDpNN.md`（例: `20240707p01.md`）
- 同日に複数エントリがある場合は `p01`, `p02`, ... とインクリメント

## ビルド・開発コマンド

```bash
pnpm install   # 依存関係インストール
pnpm dev       # 開発サーバー起動
pnpm build     # 本番ビルド（型チェック含む）
pnpm preview   # ビルドプレビュー
pnpm lint      # ESLintチェック
pnpm test      # テスト実行（Vitest）
```

## 日記作成コマンド

新しい日記ファイルを規約どおりの場所と命名で生成します：

```bash
pnpm run diary            # 今日のテンプレを作成して VS Code で開く
pnpm run diary 2025-09-01 # 任意日付（YYYY-MM-DD）
```

- 出力先: `src/content/posts/YYYY/`
- 命名: `YYYYMMDDpNN.md`（同日内で `pNN` を自動インクリメント）
- 初期frontmatter: `title: 'YYYY-MM-DDの日記'`, `date`, `tags`, `draft: true`
- 生成後に `code -r <path>` を実行して VS Code で開く

## 検索機能

### サイト内検索（`/search`）

- ビルド時に全記事から検索用JSONインデックスを自動生成（`/api/search-index.json`）
- クライアントサイドJavaScriptで全文検索を実行（サーバー不要、SSG対応）
- 検索対象: タイトル、本文（先頭500文字のプレーンテキスト）、タグ
- スコアリング: タイトル一致（+10）、タグ一致（+5）、本文一致（+1）
- リアルタイム検索（300msデバウンス）、URLパラメータ（`?q=`）でブックマーク共有可能

実装:
- `src/pages/search.astro` — 検索UI + クライアントJS
- `src/pages/api/search-index.json.ts` — Astro Static File Endpointでビルド時生成

### 関連記事（記事詳細ページ）

- タグの重複度（Jaccard係数: 重複数÷ユニオン数）で類似記事をスコアリング
- 同一日のエントリは除外、スコア上位3件を表示
- タグがない記事では非表示

実装: `src/components/RelatedPosts.astro`

## URL構造とリダイレクト

| 用途 | URL形式 |
|------|---------|
| 旧URL | `/diary/YYYYMMDD.html` |
| 日付別 | `/posts/YYYYMMDD/` |
| 単一エントリ | `/posts/YYYYMMDD/pNN` |
| タグ一覧 | `/tags/` |
| タグ別 | `/tags/{tag}` （小文字） |
| 年一覧 | `/years/` |
| 年別 | `/years/{YYYY}` |
| 検索 | `/search` （`?q=`でクエリ指定） |

### 旧URLからの301リダイレクト

- ルート: `src/pages/diary/[date].html.ts`
- 同日が1件: `/posts/YYYYMMDD/pNN` へ 301
- 同日が複数: `/posts/YYYYMMDD/` へ 301
- 見つからない: 404

### タグの正規化

- タグのURLは小文字スラグ（例: `/tags/life`）
- 集計・絞り込みは `normalizeTag()`（`trim().toLowerCase()`）で正規化して比較

## 画像最適化

Astro 5のImage機能により、Markdown内の画像が自動的に最適化されます：
- **WebP変換**: 自動的にWebP形式に変換して配信
- **Lazy Loading**: `loading="lazy"`が自動追加
- **レスポンシブ対応**: `layout: "constrained"` で適切なサイズ配信

## UIデザイン仕様

### 表示ルール

- 日付の表示は `YYYY-MM-DD`、URLは `YYYYMMDD` を維持
- 一覧ページはカードグリッド（モバイル1列、タブレット2列、PC3列）

### PostCard コンポーネント

- パス: `src/components/PostCard.astro`
- カード全面クリック可能（オーバーレイ実装）
- タグバッジは個別クリック可能
- 構成: 日付行 → タイトル → 説明/抜粋 → サムネイル（下部）
- 抜粋: `description`未指定時は本文先頭120文字（末尾「…」）

### アイコン

- Font Awesome（6.5.2）をCDN読み込み（BaseLayout.astro）
- 日付: `<i class="fa-regular fa-calendar">`
- GitHub: `<i class="fa-brands fa-github">`
- X: `<i class="fa-brands fa-x-twitter">`

## テスト

- ツール: Vitest（`vitest.config.ts`）
- 実行: `pnpm test`
- テストファイル: `tests/` ディレクトリ
  - `tags.test.ts`: タグ正規化
  - `dates.test.ts`: 日付ユーティリティ
  - `posts.test.ts`: 投稿取得
  - `redirect.test.ts`: リダイレクト処理
  - `diary.test.ts`: 日記作成スクリプト

## コーディング規約

### 言語・フォーマット

- Astro, TypeScript, Tailwind CSS
- Prettier（2スペースインデント）+ `prettier-plugin-astro`, `prettier-plugin-tailwindcss`
- ESLint with `eslint-plugin-astro`

### 命名規則

- Astroコンポーネント: PascalCase（`Header.astro`）
- ユーティリティ関数: lowerCamelCase
- 投稿ファイル: `YYYYMMDDpNN` 形式

### パスエイリアス

- `@/` → `src/` へのエイリアス（`tsconfig.json`, `vitest.config.ts`で設定）
- 深いrelative importより `@/` エイリアス推奨

## コミット・PRガイドライン

- コミット: 簡潔で現在形のメッセージ（日本語可）
- 例: `Astroを5.13.3へアップデート`, `タグの大文字小文字を正規化`
- PRには概要、関連Issue、UI変更時はスクリーンショット含む
- `pnpm lint` と `pnpm build` が通ることを確認

## ブランチ

- デフォルトブランチ: `master`
- 機能開発は feature branch で作業

## 開発時の注意事項

- TypeScriptの型チェックを必ず実行
- pnpmパッケージマネージャーを使用
- コンテンツ（Markdown）変更とコード変更は分けてコミット推奨
