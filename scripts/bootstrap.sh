#!/usr/bin/env bash
#
# scripts/bootstrap.sh
#
# チーム全員が「1コマンド」で開発を始められるようにする初期セットアップスクリプト。
# Node 確認 → pnpm セットアップ → 依存インストール → 次のステップ案内、まで一気通貫。
# 既に揃ってる環境では何度実行しても壊さない（冪等）。
#

set -euo pipefail

# ── 色 ────────────────────────────────────────────
if [[ -t 1 ]]; then
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  RED=$(tput setaf 1)
  BOLD=$(tput bold)
  RESET=$(tput sgr0)
else
  GREEN=""; YELLOW=""; RED=""; BOLD=""; RESET=""
fi

step() { echo ""; echo "${GREEN}${BOLD}==> $1${RESET}"; }
ok()   { echo "${GREEN}  ✓${RESET} $1"; }
warn() { echo "${YELLOW}  ⚠${RESET} $1"; }
err()  { echo "${RED}  ✗${RESET} $1" >&2; }

# ── リポジトリ ルート確認 ─────────────────────────
if [[ ! -f "package.json" ]] || ! grep -q '"name": "kobe-in-your-poket-client"' package.json; then
  err "リポジトリのルートで実行してください（package.json が見つからないか別物）"
  exit 1
fi

EXPECTED_NODE="22.16.0"
EXPECTED_PNPM="11.7.0"

# ── 1. Node.js ────────────────────────────────────
step "Node.js を確認"
if ! command -v node >/dev/null 2>&1; then
  err "Node.js がインストールされていません。"
  echo ""
  echo "推奨: mise でリポジトリの .tool-versions に従って一括インストール"
  echo ""
  echo "  brew install mise"
  echo "  eval \"\$(mise activate \$(basename \$SHELL))\""
  echo "  mise install"
  echo ""
  echo "その後、もう一度このスクリプトを実行してください。"
  exit 1
fi

NODE_VER=$(node --version | sed 's/^v//')
if [[ "$NODE_VER" == "$EXPECTED_NODE" ]]; then
  ok "node $NODE_VER"
else
  warn "node $NODE_VER 検出（期待: $EXPECTED_NODE）"
  warn "mise install / nvm use などでバージョンを揃えてください"
fi

# ── 2. pnpm ───────────────────────────────────────
step "pnpm を確認"
if command -v pnpm >/dev/null 2>&1; then
  PNPM_VER=$(pnpm --version)
  if [[ "$PNPM_VER" == "$EXPECTED_PNPM" ]]; then
    ok "pnpm $PNPM_VER"
  else
    warn "pnpm $PNPM_VER 検出（期待: $EXPECTED_PNPM）"
    warn "Corepack 経由なら 'corepack prepare pnpm@$EXPECTED_PNPM --activate' で揃う"
  fi
else
  echo "  pnpm 未インストール。Corepack で有効化を試みます..."
  if corepack enable 2>/dev/null; then
    ok "corepack enable 成功"
    corepack prepare pnpm@$EXPECTED_PNPM --activate 2>/dev/null || true
    ok "pnpm@$EXPECTED_PNPM をアクティベート"
  else
    err "corepack enable に失敗（おそらく /usr/local/bin の権限不足）"
    echo ""
    echo "以下のいずれかを実行してから、再度このスクリプトを動かしてください："
    echo ""
    echo "  ${BOLD}オプション1（推奨・1回パスワード入力）:${RESET}"
    echo "    sudo corepack enable"
    echo ""
    echo "  ${BOLD}オプション2（brew 利用）:${RESET}"
    echo "    brew install pnpm"
    echo ""
    echo "  ${BOLD}オプション3（mise 利用）:${RESET}"
    echo "    mise install   # .tool-versions から pnpm も入る"
    echo ""
    exit 1
  fi
fi

# ── 3. 依存インストール ───────────────────────────
step "依存パッケージをインストール"
pnpm install
ok "pnpm install 完了"

# ── 4. 次のステップ ───────────────────────────────
step "セットアップ完了！${BOLD}次のステップ${RESET}"
cat <<EOF

  ${BOLD}環境チェック${RESET}
    bash scripts/doctor.sh

  ${BOLD}アプリ起動${RESET}
    pnpm ios       # iPhone 15 (iOS 18) を自動起動 (Mac のみ)
    pnpm android   # Pixel_8_API34 (Android 14) を自動起動
    pnpm web       # ブラウザで起動

  ${BOLD}ドキュメント${RESET}
    docs/dev-environment.md     # iOS / Android Emulator のセットアップ
    docs/spec/ (別リポ)         # 仕様

EOF
