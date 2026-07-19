# 全文検索と関連記事の実装

## 目的

1,500件を超える日記を静的サイトのまま全文検索できるようにし、各記事から本文内容が近い過去記事へ移動できるようにする。既存の手動タグは分類と絞り込みのために維持し、関連記事の順位付けには使用しない。

## 全体構成

全文検索と関連記事は別の仕組みで実装している。

- 全文検索: Pagefindを使用する。
- 関連記事: プロジェクト内の独自実装で、タイトルとMarkdown本文のTF-IDFコサイン類似度を計算する。

主要ファイル:

- `pagefind.yml`: Pagefindの索引対象を投稿詳細HTMLへ限定する。
- `src/pages/search.astro`: Pagefind Search APIを使う検索画面。
- `src/components/Header.astro`: PC・モバイル用の検索候補UIの配置。
- `src/components/SearchSuggestions.astro`: 検索候補の表示とキーボード操作。
- `src/lib/pagefind-client.ts`: Pagefindの遅延ロードと検索処理を共通化するクライアント。
- `astro.config.mjs`: ビルド済みPagefindバンドルを開発サーバーから配信するViteプラグイン。
- `src/lib/related-posts.ts`: 本文類似度の計算とランキング。
- `src/components/RelatedPosts.astro`: 関連記事の表示。
- `src/pages/posts/[date]/[part].astro`: Pagefindメタデータの付与と関連記事の事前計算。

## 全文検索

### 本番ビルド

`pnpm build`は次の順番で処理する。

1. `astro check`
2. `astro build`
3. `pagefind`

Pagefindは`dist/posts/**/p*/index.html`だけを読み、`data-pagefind-body`が付いた記事本文を索引化する。旧URLのリダイレクトHTML、一覧ページ、タグページは対象外とする。

記事HTMLには次の情報を設定する。

- `title`: 記事タイトル
- `date`: `YYYY-MM-DD`形式の日付
- `tags`: 元のタグ配列をJSON文字列にしたメタデータ
- `tag`: 正規化済みタグのPagefindフィルター

検索画面は`/pagefind/pagefind.js`を遅延ロードし、300ミリ秒のデバウンス後に検索する。結果は最大50件で、日付、タイトル、本文抜粋、タグを表示する。DOMは`innerHTML`で組み立てず、テキストノードを使って検索語をハイライトする。

### 入力途中の検索候補

ヘッダーのPC・モバイル検索欄では、2文字以上の入力後にPagefindを検索し、上位5件を候補として表示する。別の索引やサーバーAPIは追加せず、検索画面と同じPagefind索引と`src/lib/pagefind-client.ts`を共有する。

候補には日付、タイトル、本文抜粋を表示する。候補を選ばずEnterを押した場合は従来どおり`/search?q=...`へ移動し、「すべての検索結果を見る」からも全件表示へ移動できる。

操作とアクセシビリティは次のとおり。

- 入力欄はARIA combobox、候補一覧はlistboxとして公開する。
- 上下キーで候補を移動し、Enterで選択した記事へ移動する。
- Escapeまたは候補UIの外側をクリックすると閉じる。
- 入力欄へフォーカスした時点でPagefindを先読みし、初回検索の待ち時間を短縮する。
- 新しい入力が行われた場合は古い検索結果を破棄し、遅れて返った候補で表示を上書きしない。

### 開発サーバー

Pagefindは生成済みHTMLから索引を作るため、`astro dev`だけでは索引を生成できない。ローカルでは次の順番で起動する。

```bash
pnpm build
pnpm dev
```

`astro.config.mjs`の開発専用Viteプラグインが、`dist/pagefind`内の実ファイルだけを`/pagefind/`から配信する。`dist`全体は公開せず、パスを正規化してディレクトリ外へのアクセスを拒否する。コンテンツ更新後は再度`pnpm build`を実行し、開発サーバーを再起動する。検索候補も同じ索引を使うため、この前提は共通である。

## 関連記事

### 採用方式

関連記事のランキングは外部ライブラリや生成AIを使わない。`src/lib/related-posts.ts`で次を組み合わせている。

- Markdownのプレーンテキスト化: 既存の`mdToPlainText()`（unified、remark-parse、strip-markdown）
- 日本語の単語分割: JavaScript標準の`Intl.Segmenter`
- 類似度: 独自実装のTF-IDFとコサイン類似度

本文からタグを自動生成する方式は採用しない。自動タグを既存の手動タグと混在させると、タグ一覧の意味と品質が変わるためである。

### 前処理

各記事のタイトルと本文に対して次を行う。

1. Markdownをプレーンテキストへ変換する。
2. UnicodeをNFKCで正規化し、小文字化する。
3. `Intl.Segmenter("ja", { granularity: "word" })`で単語へ分割する。
4. 1文字の語、数字だけの語、定義済みストップワードを除外する。
5. タイトル内の語は出現回数を3倍として、本文より強く評価する。
6. 20件以上の記事がある場合、全記事の20%を超えて現れる語を一般語として除外する。

### TF-IDF

語`t`の記事`d`内での重みは次の式で求める。

```text
TF(t, d)  = 1 + ln(記事内の重み付き出現回数)
IDF(t)    = ln((全記事数 + 1) / (語を含む記事数 + 1)) + 1
weight    = TF(t, d) × IDF(t)
```

各記事を`term -> weight`の疎ベクトルにし、記事間のコサイン類似度を計算する。

```text
similarity(a, b) = dot(a, b) / (norm(a) × norm(b))
```

全記事の総当たり比較は行わない。語ごとに、その語を含む記事と重みを持つ転置インデックスを作り、共通語を持つ記事だけの内積を加算する。

### 並び順と除外条件

候補は次の順番で最大3件を選ぶ。

1. コサイン類似度の降順
2. 投稿日の距離が近い順
3. 新しい記事順
4. entry ID順

自分自身と同じ日付の別エントリは除外する。共通する有効語がない場合は「関連する記事はありません。」と表示する。

### ビルドへの組み込み

`src/pages/posts/[date]/[part].astro`の`getStaticPaths()`で、全投稿の本文を一度だけ解析して`Map<entryId, relatedPosts>`を作る。各記事ページには計算済みの最大3件だけをpropsとして渡すため、ブラウザで類似度計算は行わない。

## 制約と調整ポイント

- TF-IDFは語の一致を見るため、同義語だけで書かれた記事同士は近いと判定できない。
- ストップワードと文書頻度20%の閾値は、実データの結果を見ながら調整する。
- タイトル倍率3は、短い記事でも主題を反映させるための設定である。
- 意味ベクトルや外部APIを使わないため、追加インフラ、API費用、ネットワーク依存はない。
- 本文変更後の検索索引と関連記事は、次回の`pnpm build`で更新される。

## 検証

```bash
pnpm test            # TF-IDF順位、同日除外、同点処理
pnpm build           # 全記事の生成とPagefind索引
pnpm test:output     # 検索メタデータ、関連記事URL、最大3件
pnpm test:e2e        # astro previewで検索UIを確認
pnpm test:e2e:dev    # astro devでビルド済み索引と関連記事を確認
pnpm verify          # 上記を含む全検証
```

`tests/related-posts.test.ts`は本文の類似度が高い記事を優先すること、自分自身と同日記事を除外すること、同点時の並び順を検証する。`tests/output/build-output.test.ts`は全生成記事について関連記事が最大3件で、存在する`/posts/YYYYMMDD/pNN`を指し、同日記事を含まないことを検証する。PlaywrightのE2Eでは、PC・モバイルの候補表示、キーボード選択、Escapeで閉じる操作、および開発サーバーから候補を取得できることを確認する。
