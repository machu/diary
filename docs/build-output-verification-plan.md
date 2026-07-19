# ビルド出力検証の自動化計画

## 目的

Astro の静的ビルド後に生成される `dist/**/*.html` を自動検証し、日付表記、タグ URL、ページネーション、旧 URL の転送先が意図せず変わることを防ぐ。あわせて、主要なユーザー導線だけを Playwright で検証する。

## 実現性と制約

静的 HTML の契約テストと、`astro preview` を使った Playwright E2E はローカルと CI の両方で実行できる。

旧 URL の実装は、静的ビルドでは `301` レスポンスではなく、meta refresh を含む HTML として出力される。`astro preview` もこのファイルを `200 OK` で返す。そのため、次の二層に分けて検証する。

- ローカル・CI: meta refresh、canonical、代替リンク、転送先ファイルを検証する。
- Vercel Preview: Bulk Redirects により実際に `301` と正しい `Location` が返ることを確認する。

Vercel Bulk Redirects はローカルサーバーでは再現できない。この制約は、ビルド時に生成する JSONL の全件検証と、デプロイ後の代表 URL に対する HTTP 確認を組み合わせて補う。

## 実装方針

### 1. ビルド出力テスト

通常のユニットテストとは設定を分離し、既存の `dist/` を Vitest で検証する。

追加する主なファイル:

- `vitest.output.config.ts`
- `tests/output/helpers.ts`
- `tests/output/build-output.test.ts`

検証項目:

1. 全 HTML が通常ページまたはリダイレクトページとして必要な基本要素を持つ。
2. `/posts/YYYYMMDD/` と `/posts/YYYYMMDD/pNN` の表示日付が `YYYY-MM-DD` である。
3. `/tags/` 配下のリンクが小文字スラグで、リンク先ページが存在する。
4. ページ番号が連続し、前後リンク、ページ表示、1 ページ 30 件の契約が一致する。
5. 全 `/diary/YYYYMMDD.html` の meta refresh、canonical、代替リンクが一致し、単一記事日と複数記事日で正しい転送先を指す。

HTML 全体のスナップショットは作らない。パスから期待値を導出し、コンテンツ追加で不要に壊れない契約テストにする。多数の HTML を同時にメモリへ読み込まず、順次処理する。

### 2. Vercel の HTTP 301

Astro ビルド後の `dist/posts/` を走査し、公開対象だけを元に Bulk Redirects 用 JSONL を生成する。ソース Markdown のファイル名を直接使わないことで、`draft: true` の記事を誤って含めない。

追加する主なファイル:

- `scripts/generate-vercel-redirects.mjs`
- `vercel.json`

生成物:

- `dist/redirects.jsonl`

各レコードは旧 URL、転送先、`statusCode: 301` を持つ。出力テストで、旧 URL HTML との件数・転送先の一致、source の一意性、転送先ファイルの存在を全件確認する。

### 3. 最小 Playwright E2E

Chromium のみを使い、次の主要導線を検証する。

- トップのカードから記事詳細へ移動する。
- トップから 2 ページ目へ進み、トップへ戻る。
- 大文字を含む表示タグから小文字スラグのタグページへ移動する。
- 旧 URL から正しい新 URL へ遷移する。

外部画像や CDN の成功には依存せず、URL、見出し、アクセシブルなリンク名で判定する。ローカル E2E は meta refresh 後の遷移を検証し、HTTP 301 は Vercel Preview に対する別の確認コマンドで検証する。

### 4. 実行コマンド

既存の高速な `pnpm test` は維持する。

```bash
pnpm test          # ユニットテスト
pnpm build         # 型チェック、静的ビルド、redirects.jsonl 生成
pnpm test:output   # 既存 dist の契約テスト
pnpm test:e2e      # astro preview + Playwright
pnpm verify        # test → lint → build → test:output → test:e2e
```

`test:output` と `test:e2e` は `dist/` が無い場合、先に `pnpm build` が必要であることを明示して失敗させる。`verify` ではビルドを一度だけ実行する。

## 実装順序

1. ビルド出力用 Vitest 設定と HTML ヘルパーを追加する。
2. 日付、タグ、ページネーション、旧 URL の成果物テストを追加する。
3. Vercel Bulk Redirects の生成処理と設定を追加する。
4. Playwright の設定と最小 E2E を追加する。
5. `package.json`、README、TODO を更新する。
6. `pnpm verify` を実行する。
7. Vercel Preview で単一記事日と複数記事日の `301` と `Location` を確認する。

## 完了条件

- `pnpm verify` が成功する。
- 日付、タグ URL、ページネーション、旧 URL の転送先が全生成対象について検証される。
- E2E が Chromium で主要導線を検証する。
- `dist/redirects.jsonl` が公開対象の記事だけから生成される。
- Vercel Preview の代表的な旧 URL が `301` と正しい `Location` を返す。
