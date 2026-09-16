#!/usr/bin/env bash
#
# scripts/start-ios.sh
#
# `pnpm ios` から呼ばれるラッパー。
# チーム共通のメイン機種 "iPhone 15"（シミュレータ）を自動で起動してから
# Dev Client + Metro を立ち上げる。既に起動済みなら再 boot しない。
#
# react-native-maps などネイティブモジュールを含むため Expo Go では動かず、
# EAS でビルドした Dev Client が必要。Android の配布 APK と同じ思想。
#   - シミュレータ用 Dev Client: eas build -p ios --profile development-ios-sim
#   - 実機用 Dev Client:         eas build -p ios --profile development-ios
#
# 実機に向けたい場合は IOS_TARGET=device を付けて実行:
#   IOS_TARGET=device pnpm ios
#

set -euo pipefail

TARGET_DEVICE="iPhone 15"
IOS_BUNDLE_ID="com.kobeinyourpocket.client"
EXPO_SCHEME="kobeinyourpoketclient"
IOS_TARGET="${IOS_TARGET:-simulator}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

run_expo() {
  if command -v pnpm >/dev/null 2>&1; then
    exec pnpm exec expo "$@"
  else
    exec npx -y pnpm@11.7.0 exec expo "$@"
  fi
}

ensure_dev_client_dep() {
  if [[ ! -d "${PROJECT_ROOT}/node_modules/expo-dev-client" ]]; then
    echo "ERROR: expo-dev-client が未インストールです。ブランチ切替後は pnpm install を実行してください。" >&2
    exit 1
  fi
}

# ── .env 読み込み（Maps API キーなど。EAS 製 Dev Client では未設定でも可） ──
# shellcheck source=lib/load-env.sh
source "$SCRIPT_DIR/lib/load-env.sh"
load_env_file "$PROJECT_ROOT/.env"

# ── 前提チェック ──────────────────────────────────
if ! command -v xcrun >/dev/null 2>&1; then
  echo "ERROR: Xcode が見つかりません。App Store からインストールしてください。" >&2
  echo "  詳細: docs/dev-environment.md §3" >&2
  exit 1
fi

# ════════════════════════════════════════════════════
# 実機モード: IOS_TARGET=device
# ════════════════════════════════════════════════════
if [[ "$IOS_TARGET" == "device" ]]; then
  ensure_dev_client_dep
  echo "▶ 実機モード（IOS_TARGET=device）"
  echo "  EAS 製 Dev Client がインストール済みの実機を USB 接続してください。"
  echo "  未ビルドなら: eas build -p ios --profile development-ios"
  echo "▶ Dev Client + Metro を起動（接続実機を選択）..."
  run_expo start --dev-client --scheme "${EXPO_SCHEME}" --clear
fi

# ════════════════════════════════════════════════════
# シミュレータモード（既定）
# ════════════════════════════════════════════════════

# ── Simulator デバイスの存在確認 ─────────────────
if ! xcrun simctl list devices available 2>/dev/null | grep -q "${TARGET_DEVICE}"; then
  echo "ERROR: Simulator '${TARGET_DEVICE}' が見つかりません。" >&2
  echo "" >&2
  echo "利用可能な iOS Simulator:" >&2
  xcrun simctl list devices available 2>/dev/null | sed 's/^/  /' >&2
  echo "" >&2
  echo "iOS Runtime が未インストールの可能性。Xcode → Settings → Components で追加してください。" >&2
  exit 1
fi

# ── 既に booted な「別機種」をシャットダウン ──────
# 他機種が立ってると Expo がそっちを掴むので、メイン以外は落とす。
# パイプライン途中で grep がマッチなしだと exit 1 になるので || true で吸収。
OTHERS=$(xcrun simctl list devices booted 2>/dev/null \
  | grep -E "iPhone|iPad" \
  | grep -v "${TARGET_DEVICE}" \
  | sed -n 's/.*(\([0-9A-F-]*\)) (Booted).*/\1/p' || true)

if [[ -n "$OTHERS" ]]; then
  echo "▶ メイン以外の Simulator をシャットダウン..."
  while IFS= read -r udid; do
    [[ -z "$udid" ]] && continue
    name=$(xcrun simctl list devices 2>/dev/null | grep "$udid" | sed -E 's/^[[:space:]]+([^(]+).*/\1/' | xargs || true)
    echo "  - ${name:-unknown} ($udid)"
    xcrun simctl shutdown "$udid" 2>/dev/null || true
  done <<< "$OTHERS"
fi

# ── メイン機種を boot（既に booted ならスキップ） ─
if xcrun simctl list devices booted 2>/dev/null | grep -q "${TARGET_DEVICE}"; then
  echo "✓ ${TARGET_DEVICE} は既に起動済み"
else
  echo "▶ ${TARGET_DEVICE} を起動..."
  xcrun simctl boot "${TARGET_DEVICE}"
fi

# ── Simulator.app を前面に ────────────────────────
open -a Simulator
sleep 2

# ── 対象シミュレータの UDID を取得 ────────────────
TARGET_UDID=$(xcrun simctl list devices booted 2>/dev/null \
  | grep "${TARGET_DEVICE}" \
  | sed -n 's/.*(\([0-9A-F-]*\)) (Booted).*/\1/p' \
  | head -1 || true)

# ── Dev Client インストール済みか確認 ─────────────
dev_client_installed() {
  [[ -n "$TARGET_UDID" ]] || return 1
  xcrun simctl get_app_container "$TARGET_UDID" "$IOS_BUNDLE_ID" >/dev/null 2>&1
}

# ── Expo 起動 ─────────────────────────────────────
# Dev Client が入っていれば --dev-client で Metro 接続（保存でリロード）。
# 入っていなければ EAS 製シミュレータ Dev Client の導入を案内。
if dev_client_installed; then
  ensure_dev_client_dep
  # 古い anonymous Dev Client が残っていれば注意喚起
  if xcrun simctl get_app_container "$TARGET_UDID" "com.anonymous.KOBEinYourPoketClient" >/dev/null 2>&1; then
    echo "⚠ 古い Dev Client (com.anonymous.KOBEinYourPoketClient) が残っています"
    echo "  問題があれば: xcrun simctl uninstall ${TARGET_UDID} com.anonymous.KOBEinYourPoketClient"
  fi
  if [[ -n "${GOOGLE_MAPS_API_KEY:-}" ]]; then
    echo "✓ Dev Client (${IOS_BUNDLE_ID}) + .env（ローカル開発）"
  else
    echo "✓ Dev Client (${IOS_BUNDLE_ID})（EAS 配布 — .env 不要）"
  fi
  echo "▶ Dev Client + Metro を ${TARGET_DEVICE} に向けて起動（保存でリロード）..."
  run_expo start --dev-client --ios --scheme "${EXPO_SCHEME}" --clear
else
  echo "ERROR: Dev Client (${IOS_BUNDLE_ID}) が ${TARGET_DEVICE} に未インストールです。" >&2
  echo "" >&2
  echo "  react-native-maps 等のネイティブモジュールを含むため、EAS 製 Dev Client が必要です。" >&2
  echo "" >&2
  echo "  チームメンバー: 配布された .app をインストール → docs/dev-client-distribution.md" >&2
  echo "    eas build:list -p ios --profile development-ios-sim   # 既存ビルドを確認" >&2
  echo "" >&2
  echo "  配布担当 / ローカル初回: シミュレータ用 Dev Client をビルド（Apple 証明書 不要）" >&2
  echo "    eas build -p ios --profile development-ios-sim" >&2
  echo "    # 完了後、ダウンロードした .app を:" >&2
  echo "    #   xcrun simctl install ${TARGET_UDID:-booted} <path-to>.app" >&2
  echo "" >&2
  exit 1
fi
