/**
 * バックエンド REST API のベース URL（EXPO_PUBLIC_API_BASE_URL）を返す。
 * 未設定・不正な URL・許可外プロトコル時は undefined。末尾のスラッシュは取り除く。
 */
export function getApiBaseUrl(): string | undefined {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!base) {
    return undefined;
  }

  try {
    const url = new URL(base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined;
    }

    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return undefined;
    }

    const pathname = url.pathname.replace(/\/$/, '');
    return `${url.origin}${pathname === '' ? '' : pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

let warnedMissingBaseUrl = false;

/**
 * 開発ビルドで API ベース URL 未設定（=モック動作）であることを一度だけ警告する。
 * モックで動いている部分と実APIで動いている部分を開発者が把握できるようにするための明示。
 */
export function warnIfApiBaseUrlMissing(): void {
  if (!__DEV__ || warnedMissingBaseUrl || getApiBaseUrl()) {
    return;
  }

  warnedMissingBaseUrl = true;
  console.warn(
    'EXPO_PUBLIC_API_BASE_URL が未設定のため、API はモックデータで動作します。実APIへ接続する場合は .env を設定してください（.env.example 参照）。',
  );
}
