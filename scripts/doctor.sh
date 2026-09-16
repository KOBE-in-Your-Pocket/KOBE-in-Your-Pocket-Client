#!/usr/bin/env bash
#
# scripts/doctor.sh
#
# 開発環境の状態をまとめてチェックする。
# 「自分の環境が正しいか」を1コマンドで確認したい時に使う。
#

# 色出力
if [[ -t 1 ]]; then
  GREEN="$(tput setaf 2)"
  RED="$(tput setaf 1)"
  YELLOW="$(tput setaf 3)"
  BOLD="$(tput bold)"
  RESET="$(tput sgr0)"
else
  GREEN=""; RED=""; YELLOW=""; BOLD=""; RESET=""
fi

ok()    { echo "${GREEN}✓${RESET} $1"; }
ng()    { echo "${RED}✗${RESET} $1"; FAIL=$((FAIL + 1)); }
warn()  { echo "${YELLOW}!${RESET} $1"; }
sec()   { echo ""; echo "${BOLD}== $1 ==${RESET}"; }

FAIL=0

# ── OS / Hardware ──────────────────────────────
sec "OS / Hardware"
OS="$(uname -s)"
ARCH="$(uname -m)"
IS_WSL=false
if [[ "$OS" == "Linux" ]] && grep -qi microsoft /proc/version 2>/dev/null; then
  IS_WSL=true
fi
echo "  OS: $OS"
echo "  Arch: $ARCH"
if [[ "$OS" == "Darwin" && "$ARCH" == "arm64" ]]; then
  ok "Apple Silicon Mac（推奨環境）"
elif $IS_WSL; then
  ok "WSL2 (Win11 想定)"
  echo "    → Android SDK は Windows 側 (/mnt/c/Users/\$USER/AppData/Local/Android/Sdk) を指す前提"
  echo "    → 詳細手順: docs/dev-environment.md §4.5"
elif [[ "$OS" == "Linux" ]]; then
  ok "Linux"
else
  warn "未検証の環境です"
fi

# ── Node ──────────────────────────────────────
sec "Node.js"
if command -v node >/dev/null; then
  NODE_VER="$(node --version | sed 's/^v//')"
  EXPECTED="22.16.0"
  if [[ "$NODE_VER" == "$EXPECTED" ]]; then
    ok "node $NODE_VER"
  else
    warn "node $NODE_VER（期待: $EXPECTED。mise / nvm で揃えてください）"
  fi
else
  ng "node が見つかりません"
fi

# ── pnpm ──────────────────────────────────────
sec "pnpm"
if command -v pnpm >/dev/null; then
  PNPM_VER="$(pnpm --version)"
  EXPECTED="11.7.0"
  if [[ "$PNPM_VER" == "$EXPECTED" ]]; then
    ok "pnpm $PNPM_VER"
  else
    warn "pnpm $PNPM_VER（期待: $EXPECTED。'corepack prepare pnpm@$EXPECTED --activate' で揃う）"
  fi
else
  ng "pnpm が見つかりません（corepack enable してください）"
fi

# ── Java ──────────────────────────────────────
sec "Java (Android ビルド用)"
if command -v java >/dev/null; then
  JAVA_VER="$(java -version 2>&1 | head -1)"
  echo "  $JAVA_VER"
  if echo "$JAVA_VER" | grep -qE '"(17|21)\.'; then
    ok "Java バージョン OK（17 or 21）"
  else
    warn "Java 17 or 21 を推奨"
  fi
else
  warn "java が見つかりません（Android ビルドする時に必要）"
fi

# ── Xcode (Mac only) ──────────────────────────
if [[ "$OS" == "Darwin" ]]; then
  sec "Xcode / iOS Simulator"
  if command -v xcodebuild >/dev/null; then
    XCODE_VER="$(xcodebuild -version 2>/dev/null | head -1)"
    ok "$XCODE_VER"

    RUNTIMES="$(xcrun simctl list runtimes 2>/dev/null | grep -E 'iOS (16|18|19)' || true)"
    if [[ -n "$RUNTIMES" ]]; then
      echo "$RUNTIMES" | while read -r line; do echo "    $line"; done
      # チェック: iOS 16/18/19 全部入ってるか
      for v in 16 18 19; do
        if echo "$RUNTIMES" | grep -q "iOS $v"; then
          ok "iOS $v ランタイム導入済み"
        else
          warn "iOS $v ランタイム未導入（Xcode > Settings > Platforms から追加）"
        fi
      done
    else
      ng "iOS 16/18/19 ランタイムが1つも見つかりません"
    fi

    # 指定のSimulatorデバイスが存在するか
    for d in "iPhone SE" "iPhone 15" "iPhone 17"; do
      if xcrun simctl list devices 2>/dev/null | grep -q "$d"; then
        ok "Simulator '$d' あり"
      else
        warn "Simulator '$d' が見つかりません（docs/dev-environment.md §3.3）"
      fi
    done
  else
    ng "Xcode 未インストール（App Store からインストール）"
  fi
fi

# ── Android SDK ────────────────────────────────
sec "Android SDK / AVD"
if [[ -z "${ANDROID_HOME:-}" ]]; then
  ng "環境変数 ANDROID_HOME 未設定（docs/dev-environment.md §4.3）"
  if $IS_WSL; then
    echo "    → WSL なら Windows 側 SDK を指すのが推奨:"
    echo "      export ANDROID_HOME=\"/mnt/c/Users/\$USER/AppData/Local/Android/Sdk\""
    echo "      詳細: docs/dev-environment.md §4.5"
  fi
elif [[ ! -d "$ANDROID_HOME" ]]; then
  ng "ANDROID_HOME=$ANDROID_HOME が存在しません"
else
  ok "ANDROID_HOME=$ANDROID_HOME"
fi

if command -v sdkmanager >/dev/null; then
  ok "sdkmanager 利用可能"
else
  ng "sdkmanager が見つかりません（PATH に追加要）"
fi

if command -v avdmanager >/dev/null; then
  ok "avdmanager 利用可能"
  AVDS="$(avdmanager list avd 2>/dev/null | grep 'Name:' | awk '{print $2}' || true)"
  if [[ -n "$AVDS" ]]; then
    echo "  AVD 一覧:"
    echo "$AVDS" | while read -r a; do echo "    - $a"; done
    for expected in Pixel_4a_API30 Pixel_8_API34 Pixel_9_API36; do
      if echo "$AVDS" | grep -q "^${expected}$"; then
        ok "AVD '$expected' あり"
      else
        warn "AVD '$expected' なし（'bash scripts/setup-emulators.sh' で作成）"
      fi
    done
  else
    ng "AVD が1つもありません（'bash scripts/setup-emulators.sh'）"
  fi
else
  ng "avdmanager が見つかりません"
fi

# ── プロジェクト依存 ──────────────────────────
sec "プロジェクト依存"
if [[ -d "node_modules" ]]; then
  ok "node_modules あり"
else
  warn "'pnpm install' を実行してください"
fi

if [[ -f "package.json" ]]; then
  if grep -q '"packageManager": "pnpm@11.7.0"' package.json; then
    ok "packageManager フィールド = pnpm@11.7.0"
  else
    warn "package.json の packageManager フィールドを確認"
  fi
fi

# ── 結果 ──────────────────────────────────────
echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "${GREEN}${BOLD}=== すべてOK！開発できます ===${RESET}"
  exit 0
else
  echo "${RED}${BOLD}=== ${FAIL}件のエラー。docs/dev-environment.md を参照して修正してください ===${RESET}"
  exit 1
fi
