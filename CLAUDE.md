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
│   │   ├── [...page].astro    # トップページ（ページネーション）
│   │   ├── posts/[date].astro # 日付別一覧
│   │   └── tags/              # タグ関連ページ
│   ├── components/            # UIコンポーネント
│   └── layouts/               # レイアウトテンプレート
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
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルドプレビュー
npm run lint     # ESLintチェック
```

## URL構造とリダイレクト

- 旧URL: `/diary/YYYYMMDD.html`
- 新URL: `/posts/YYYYMMDD/` または `/posts/YYYYMMDD/pNN`

同じ日に複数エントリがある場合は日付ページへ、単一エントリの場合は直接そのエントリへリダイレクトします。

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
