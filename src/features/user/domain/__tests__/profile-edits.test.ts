import {
  isValidDisplayName,
  MAX_DISPLAY_NAME_LENGTH,
  normalizeProfileEdits,
} from '../profile-edits';

describe('isValidDisplayName', () => {
  it('空文字・空白のみは不正', () => {
    expect(isValidDisplayName('')).toBe(false);
    expect(isValidDisplayName('   ')).toBe(false);
  });

  it('trim 後 1〜最大文字数なら有効', () => {
    expect(isValidDisplayName('a')).toBe(true);
    expect(isValidDisplayName('  Google 太郎  ')).toBe(true);
    expect(isValidDisplayName('あ'.repeat(MAX_DISPLAY_NAME_LENGTH))).toBe(true);
  });

  it('最大文字数を超えると不正', () => {
    expect(isValidDisplayName('あ'.repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toBe(false);
  });

  it('サロゲートペア（絵文字）は 1 文字と数える', () => {
    expect(isValidDisplayName('👍'.repeat(MAX_DISPLAY_NAME_LENGTH))).toBe(true);
    expect(isValidDisplayName('👍'.repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toBe(false);
  });
});

describe('normalizeProfileEdits', () => {
  it('表示名を trim して返す', () => {
    expect(
      normalizeProfileEdits({ name: '  新しい名前  ', iconUrl: 'https://example.com/a.png' }),
    ).toEqual({ name: '新しい名前', iconUrl: 'https://example.com/a.png' });
  });

  it('表示名が不正な場合は null を返す', () => {
    expect(normalizeProfileEdits({ name: '   ', iconUrl: '' })).toBeNull();
  });
});
