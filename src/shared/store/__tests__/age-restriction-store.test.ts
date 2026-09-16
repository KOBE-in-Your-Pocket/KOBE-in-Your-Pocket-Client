import { useAgeRestrictionStore } from '@/shared/store';

// 年齢制限フラグの state 遷移のみを検証する。永続化（同意記録）は features/legal 側の責務。

describe('useAgeRestrictionStore', () => {
  const initialState = useAgeRestrictionStore.getState();

  beforeEach(() => {
    // singleton ストアをテスト間で隔離するため初期 state へ戻す。
    useAgeRestrictionStore.setState(initialState, true);
  });

  describe('初期 state', () => {
    it('isAdult は false（制限あり）である', () => {
      // 同意記録を読み終える前に個人情報に関わる機能が開かないよう、安全側に倒している。
      expect(useAgeRestrictionStore.getState().isAdult).toBe(false);
    });
  });

  describe('setIsAdult', () => {
    it('true を設定すると isAdult が true になる', () => {
      useAgeRestrictionStore.getState().setIsAdult(true);

      expect(useAgeRestrictionStore.getState().isAdult).toBe(true);
    });

    it('true のあと false を設定すると制限ありへ戻る', () => {
      const { setIsAdult } = useAgeRestrictionStore.getState();

      setIsAdult(true);
      setIsAdult(false);

      expect(useAgeRestrictionStore.getState().isAdult).toBe(false);
    });

    it('isAdult 以外の state（setIsAdult 参照）は変化させない', () => {
      const before = useAgeRestrictionStore.getState().setIsAdult;

      useAgeRestrictionStore.getState().setIsAdult(true);

      expect(useAgeRestrictionStore.getState().setIsAdult).toBe(before);
    });
  });
});
