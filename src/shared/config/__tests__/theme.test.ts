import { Colors } from '../theme';

describe('Colors（カラートークン）', () => {
  it('ライトとダークは同じトークンキーを持つ（抜け漏れ防止）', () => {
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });

  it('既存トークンのライト値は従来どおり（基盤導入による回帰を防ぐ）', () => {
    // 既存画面の見た目を変えないため、置き換え前から使われているトークンのライト値を固定する。
    expect(Colors.light).toMatchObject({
      text: '#000000',
      background: '#ffffff',
      backgroundElement: '#F0F0F3',
      backgroundSelected: '#E0E1E6',
      textSecondary: '#60646C',
    });
  });

  it('プライマリ・ボーダー等のトークンがライト/ダーク両方で定義されている', () => {
    for (const scheme of [Colors.light, Colors.dark] as const) {
      expect(scheme.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(scheme.onPrimary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(scheme.border).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
