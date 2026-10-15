import { MAX_DISPLAY_NAME_LENGTH, normalizeAppleDisplayName } from '../apple-display-name';

describe('normalizeAppleDisplayName', () => {
  it('前後の空白を除く', () => {
    expect(normalizeAppleDisplayName('  山田 太郎  ')).toBe('山田 太郎');
  });

  it.each([null, undefined, '', '   '])('空（%p）なら null を返す', (raw) => {
    expect(normalizeAppleDisplayName(raw)).toBeNull();
  });

  it('最大長を超える分は切り詰める', () => {
    const result = normalizeAppleDisplayName('x'.repeat(MAX_DISPLAY_NAME_LENGTH + 10));
    expect(result).toBe('x'.repeat(MAX_DISPLAY_NAME_LENGTH));
  });

  it('サロゲートペアの途中では切らない', () => {
    // 99 文字 + 絵文字（UTF-16 で 2 単位）→ 101 単位。絵文字ごと落とす。
    const result = normalizeAppleDisplayName(`${'x'.repeat(MAX_DISPLAY_NAME_LENGTH - 1)}😀`);
    expect(result).toBe('x'.repeat(MAX_DISPLAY_NAME_LENGTH - 1));
  });
});
