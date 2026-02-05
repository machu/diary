#!/usr/bin/env bash
# build-search-index.sh — Astroビルド前にQMDインデックスを生成する
#
# Usage:
#   ./scripts/build-search-index.sh          # フルビルド（BM25 + ベクトル）
#   ./scripts/build-search-index.sh --bm25   # BM25のみ（高速、CI向け）
#   ./scripts/build-search-index.sh --update  # 差分更新（git pull + re-index）
#
# 前提: qmd (github:tobi/qmd) がインストール済み
#   bun install -g github:tobi/qmd

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
POSTS_DIR="$REPO_ROOT/src/content/posts"
COLLECTION_NAME="diary"
MASK="**/*.md"

# カラー出力
info()  { echo -e "\033[1;34m[search-index]\033[0m $*"; }
ok()    { echo -e "\033[1;32m[search-index]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[search-index]\033[0m $*"; }
error() { echo -e "\033[1;31m[search-index]\033[0m $*" >&2; }

# qmd が使えるか確認
if ! command -v qmd &>/dev/null; then
  error "qmd が見つかりません。インストールしてください:"
  error "  bun install -g github:tobi/qmd"
  exit 1
fi

# 引数パース
MODE="full"
if [[ "${1:-}" == "--bm25" ]]; then
  MODE="bm25"
elif [[ "${1:-}" == "--update" ]]; then
  MODE="update"
fi

cd "$REPO_ROOT"

# --- 差分更新モード ---
if [[ "$MODE" == "update" ]]; then
  info "差分更新モード: git pull + re-index"
  qmd update --pull
  ok "差分更新完了"
  exit 0
fi

# --- コレクション作成/更新 ---
info "投稿ディレクトリ: $POSTS_DIR"

# 既存コレクションの確認
if qmd collection list 2>&1 | grep -q "$COLLECTION_NAME"; then
  info "既存コレクション '$COLLECTION_NAME' を更新中..."
  qmd update
else
  info "コレクション '$COLLECTION_NAME' を新規作成中..."
  qmd collection add "$POSTS_DIR" --name "$COLLECTION_NAME" --mask "$MASK"
fi

# インデックス件数の確認
DOC_COUNT=$(qmd status 2>&1 | grep "Total:" | awk '{print $2}')
info "インデックス済み: ${DOC_COUNT} 件"

if [[ "${DOC_COUNT:-0}" -eq 0 ]]; then
  error "インデックスが空です。$POSTS_DIR にMarkdownファイルがあるか確認してください。"
  exit 1
fi

ok "BM25インデックス構築完了 ✅"

# --- ベクトルembedding ---
if [[ "$MODE" == "bm25" ]]; then
  warn "BM25のみモード: ベクトルembeddingをスキップ"
  exit 0
fi

info "ベクトルembedding生成中... (初回はモデルDLのため時間がかかります)"
qmd embed
ok "ベクトルembedding完了 ✅"

# --- 検証 ---
info "検索テスト実行中..."
SEARCH_RESULT=$(qmd search "テスト" -n 1 --files 2>&1 || true)
if [[ -n "$SEARCH_RESULT" ]]; then
  ok "BM25検索: OK"
else
  warn "BM25検索: 結果なし（データ内容によっては正常）"
fi

VSEARCH_RESULT=$(qmd vsearch "テスト" -n 1 --files 2>&1 || true)
if echo "$VSEARCH_RESULT" | grep -q "Vector index not found"; then
  warn "ベクトル検索: インデックス未生成"
else
  ok "ベクトル検索: OK"
fi

echo ""
ok "検索インデックスの構築が完了しました 🎉"
qmd status
