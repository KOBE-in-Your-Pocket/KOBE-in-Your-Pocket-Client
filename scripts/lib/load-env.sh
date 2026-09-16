#!/usr/bin/env bash
#
# リポジトリ直下の .env を読み込み、export する。
# KEY=VALUE 形式のみ対応（値に空白がある場合は引用符で囲む）。
#

load_env_file() {
  local env_file="${1:-.env}"

  if [[ ! -f "$env_file" ]]; then
    return 0
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [[ -z "$line" ]] && continue
    [[ "$line" != *=* ]] && continue
    export "$line"
  done <"$env_file"
}
