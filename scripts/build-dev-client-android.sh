#!/usr/bin/env bash
#
# scripts/build-dev-client-android.sh
#
# チーム配布用 Dev Client (Android APK) を EAS Build で作成する。
# Maps API キーは EAS Secrets の GOOGLE_MAPS_API_KEY から注入される。
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "▶ Dev Client (Android APK) を EAS Build で作成します"
echo ""
echo "事前準備（初回のみ）:"
echo "  1. pnpm dlx eas-cli login"
echo "  2. pnpm dlx eas-cli env:create development --name GOOGLE_MAPS_API_KEY --value <your-key> --visibility secret"
echo "  3. ビルド完了後、EAS Credentials の SHA-1 を GCP API キー制限に追加"
echo "     詳細: docs/dev-client-distribution.md"
echo ""

if ! pnpm dlx eas-cli whoami >/dev/null 2>&1; then
  echo "ERROR: EAS にログインしていません。pnpm dlx eas-cli login を実行してください。" >&2
  exit 1
fi

pnpm dlx eas-cli build --platform android --profile development "$@"
