import { termsOfUseUrl } from '../terms-of-use';

describe('termsOfUseUrl', () => {
  it('既定言語（en）はベース URL 直下を返す', () => {
    expect(termsOfUseUrl('en')).toBe('https://kobe-in-your-pocket.github.io/terms/');
  });

  it('対応言語は言語コードのサブパスを返す', () => {
    expect(termsOfUseUrl('ja')).toBe('https://kobe-in-your-pocket.github.io/terms/ja/');
    expect(termsOfUseUrl('ko')).toBe('https://kobe-in-your-pocket.github.io/terms/ko/');
    expect(termsOfUseUrl('zh')).toBe('https://kobe-in-your-pocket.github.io/terms/zh/');
  });

  it('未対応の言語は既定言語の URL を返す', () => {
    expect(termsOfUseUrl('fr')).toBe('https://kobe-in-your-pocket.github.io/terms/');
  });
});
