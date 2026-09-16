import { getApiBaseUrl, warnIfApiBaseUrlMissing } from '../api';

/** 元値が undefined の場合は delete で復元する（代入すると文字列 "undefined" が残るため）。 */
function restoreBaseUrl(original: string | undefined): void {
  if (original === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = original;
  }
}

describe('getApiBaseUrl', () => {
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    restoreBaseUrl(originalBaseUrl);
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('未設定・空白のみの場合は undefined を返す', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(getApiBaseUrl()).toBeUndefined();

    process.env.EXPO_PUBLIC_API_BASE_URL = '   ';
    expect(getApiBaseUrl()).toBeUndefined();
  });

  it('末尾スラッシュを除去して返す', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:9090/';
    expect(getApiBaseUrl()).toBe('http://10.0.2.2:9090');
  });

  it('不正な URL は undefined を返す', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'not-a-url';
    expect(getApiBaseUrl()).toBeUndefined();
  });

  it('http/https 以外のプロトコルは undefined を返す', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'ftp://api.example.com';
    expect(getApiBaseUrl()).toBeUndefined();
  });

  it('本番環境では http を拒否する', () => {
    process.env.NODE_ENV = 'production';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://api.example.com';
    expect(getApiBaseUrl()).toBeUndefined();
  });

  it('本番環境では https を許可する', () => {
    process.env.NODE_ENV = 'production';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });
});

// 警告は「一度だけ」仕様（モジュール内フラグ）のため、設定済みケースを先に検証する
describe('warnIfApiBaseUrlMissing', () => {
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    restoreBaseUrl(originalBaseUrl);
  });

  it('設定済みの場合は警告しない', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:9090';

    warnIfApiBaseUrlMissing();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('未設定の場合はモック動作の警告を一度だけ出す', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    warnIfApiBaseUrlMissing();
    warnIfApiBaseUrlMissing();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('モックデータで動作');
  });
});
