import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';
import { useUiStore } from '@/shared/store';

// AsyncStorage は jest.setup.js で公式モックへ差し替え済み。
// ここでは uiStore の純粋な state 遷移ロジック（setLanguage）のみを検証する。

describe('useUiStore', () => {
  const initialState = useUiStore.getState();

  beforeEach(() => {
    // singleton ストアをテスト間で隔離するため初期 state へ戻す。
    useUiStore.setState(initialState, true);
  });

  describe('setLanguage', () => {
    it.each(SUPPORTED_LANGUAGES)('language を %s へ更新する', (language) => {
      useUiStore.getState().setLanguage(language);

      expect(useUiStore.getState().language).toBe(language);
    });

    it('連続した呼び出しで最後に指定した言語が反映される', () => {
      const { setLanguage } = useUiStore.getState();

      setLanguage('en');
      setLanguage('zh');
      setLanguage('ko');

      expect(useUiStore.getState().language).toBe('ko');
    });

    it('language 以外の state（setLanguage 参照）は変化させない', () => {
      const before = useUiStore.getState().setLanguage;

      useUiStore.getState().setLanguage('ja');

      expect(useUiStore.getState().setLanguage).toBe(before);
    });

    it('同じ言語を再設定しても language は維持される', () => {
      const current = useUiStore.getState().language;

      useUiStore.getState().setLanguage(current);

      expect(useUiStore.getState().language).toBe(current);
    });
  });

  describe('初期 state', () => {
    it('language はサポート言語のいずれかである', () => {
      expect(SUPPORTED_LANGUAGES).toContain(useUiStore.getState().language as SupportedLanguage);
    });
  });
});
