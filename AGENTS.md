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
│       ├── dates.ts           # 日付/URLユーティリティ
│       ├── tags.ts            # タグの正規化（小文字化）
│       └── posts.ts           # 投稿取得（draftフィルタ共通化）
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

### ドラフトの扱い

- `draft: true` の投稿は、開発時（`pnpm dev`）のみ表示され、本番ビルドでは除外されます。
- `src/lib/posts.ts` の `getAllPosts()` が `import.meta.env.DEV` を用いて共通的に制御します。

## ビルド・開発コマンド

※npmではなくpnpmを使って下さい

```bash
pnpm dev      # 開発サーバー起動
pnpm build    # 本番ビルド（型チェック含む）
pnpm preview  # ビルドプレビュー
pnpm lint     # ESLintチェック
```

## 日記作成コマンド（開発者向け）

- 目的: 新しい日記ファイルを規約どおりの場所と命名で生成する。
- 実行:

```
pnpm run diary            # 今日のテンプレを作成して VS Code で開く
pnpm run diary -- 2025-09-01   # 任意日付（YYYY-MM-DD / YYYY/MM/DD）
```

- 仕様:
  - 出力先: `src/content/posts/YYYY/`
  - 命名: `YYYYMMDDpNN.md`（同日内で `pNN` を自動インクリメント）
  - 初期frontmatter: `title: 'YYYY-MM-DDの日記'`, `date`, `tags`, `draft: true`
  - 生成後に `code -r <path>` を実行して VS Code で開く（`code` 未導入環境では警告のみでスキップ）


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

### 2025-08 デザインアップデート（PC向け3カラム＋カード化）

- トップ（`src/pages/[...page].astro`）にヒーローを追加（1ページ目のみ表示）。
  - タイトル中央、アバターは `public/avatar.jpg` を使用。
  - GitHub/X へのリンクを表示（Font Awesomeのブランドアイコン）。
- 一覧カードを導入し、全一覧ページを統一。
  - コンポーネント: `src/components/PostCard.astro`
  - レイアウト: モバイル1列、タブレット2列、PC3列（`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`）。
  - 構成順: 上段に日付（FAカレンダーアイコン付）＋右端に小さめタグバッジ、中段にタイトルと `description`、下段にサムネイル。
  - サムネイル: フロントマター `image`（任意）を利用。未指定なら非表示。`h-40 object-cover` でトリミング表示。
- 適用範囲:
  - トップ: `src/pages/[...page].astro`
  - タグ詳細: `src/pages/tags/[tag].astro`
  - 日付別: `src/pages/posts/[date].astro`
  - 年別: `src/pages/years/[year].astro`（日付見出しごとにカードグリッドを表示）

### アイコンとアセット

- Font Awesome（6.5.2）をレイアウトでCDN読み込み（`src/layouts/BaseLayout.astro`）。
  - 注意: SRIは環境により不一致でブロックされるため付与していません。CSP等で外部CSS不可の場合は `@fortawesome/fontawesome-free` を依存に追加してローカル配信へ切替してください。
- 使用アイコン例:
  - 日付: `<i class="fa-regular fa-calendar">`
  - GitHub: `<i class="fa-brands fa-github">`
  - X: `<i class="fa-brands fa-x-twitter">`
- アバター: `public/avatar.jpg` をヒーローで使用（差し替え可）。

### PostCard コンポーネント仕様

- パス: `src/components/PostCard.astro`
- Props:
  - `title: string` — 記事タイトル
  - `url: string` — 詳細へのリンク
  - `dateDisplay: string` — 表示用日付（`YYYY-MM-DD`）
  - `tags?: string[]` — タグ（右端に小バッジ）
  - `description?: string` — 説明（任意）
  - `image?: string` — サムネ（任意。外部/内部どちらも可）
- 並び順: 日付行 → タイトル → 説明 → サムネ（下）
- 拡張案: 説明の行数制限（`line-clamp-*`）、サムネ比率の変更、`<Image />` への置換など。

### 2025-08 追加更新（カード操作性・高さ揃え・年別の月集計）

- カード全面クリック/ホバー:
  - `PostCard` はカード全面がリンク。実装はオーバーレイの `<a>` で実現（タグバッジは `pointer-events` により従来どおり個別クリック可）。
  - `group-hover:bg-muted` により、カードホバーで背景色が下部ボタンと同調して変化。
- タグバッジ色の統一変更:
  - 既定クラスを `bg-secondary text-secondary-foreground` へ変更（`src/components/TagBadges.astro`）。
  - カード内バッジも同系色に統一。
- 抜粋の生成と表示:
  - `description` が無い場合、本文（Markdown）先頭からプレーンテキスト化して120文字を抜粋し、超過時は末尾に「…」。
  - 実装: `src/components/PostCard.astro` 内で `mdToPlainText()` → `excerpt` を生成。
- 高さ揃えと行揃え:
  - `PostCard` を `h-full flex flex-col` でフルハイト化、テキスト部を `grow` に。
  - 抜粋は `line-clamp-3` で最大3行に制限。ユーティリティは `src/styles/globals.css` に追加。
  - サムネ（`image`）はカード下部に常に配置され、タイトル高さが揃う。
- 年別ページの仕様変更:
  - 日別→月別のグルーピングに変更。見出しは `YYYY-MM`、件数は月毎の総件数を表示。
  - 実装: `src/pages/years/[year].astro` で `YYYY-MM` キーのマップに変換し、各月配下は3カラムグリッドで `PostCard` を使用。

関連ファイル
- `src/components/PostCard.astro` — 全面リンク、ホバー、抜粋生成（120文字＋…）、フルハイト、サムネ下配置。
- `src/components/TagBadges.astro` — 既定の色を secondary 系へ変更。
- `src/styles/globals.css` — `line-clamp-2/3` ユーティリティ追加。
- `src/pages/years/[year].astro` — 月別集計＋3カラム化。

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
- ユニット → 出力検証 → 最小E2Eの順で導入。
- 既存の歴史データは極力触らず、テストはフィクスチャ/モック中心に。
- コンテンツ（Markdown）変更と振る舞い（コード）変更は分けてコミット。

## テスト戦略 / 実装状況

- ツール: Vitest（`vitest.config.ts`。`@/` エイリアス対応、Node環境、mocksリセット）。
- スクリプト: `pnpm test` でユニットテスト実行。
- 実装済みユニット:
  - `tests/tags.test.ts`: タグ正規化（trim + 小文字化）と等価判定。
  - `tests/redirect.test.ts`: 旧URL → 新URLの301（単一/複数/未存在）と `getStaticPaths`。`astro:content` をモック。
- 今後の拡張（案）:
  - ビルド出力検証: `dist/**/*.html` をパースし、日付表示形式（`YYYY-MM-DD`）、タグ小文字リンク、ページネーション、段組タグ一覧などを検証。
  - E2E（必要最小）: `/diary/YYYYMMDD.html` の 301、トップ/ページ送り、タグ遷移など主要導線のみ。

## Commit & Pull Request Guidelines
- Commits: concise, present-tense messages (Japanese is fine), focused scope. Examples: `Astroを5.13.3へアップデート`, `タグの大文字小文字を正規化`.
- PRs: include a summary, linked issues, and UI screenshots when relevant. Ensure `pnpm lint` and `pnpm build` pass. Describe any content migrations or alias changes.

### Branching

- 既定ブランチは `master` です（旧 `main` から移行）。
- 既存のローカルで `main` が残っている場合の切替：

```
git fetch origin
git branch -m main master
git branch -u origin/master master
git remote set-head origin -a
```

## Security & Configuration Tips
- Images: `astro.config.mjs` sets the image service to `noop` to avoid 404s. Review before enabling optimization.
- Paths: Prefer the `@/` alias over deep relative imports to keep moves safe.
