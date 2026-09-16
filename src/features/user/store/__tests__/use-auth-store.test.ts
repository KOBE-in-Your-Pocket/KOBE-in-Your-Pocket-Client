import { useAuthStore } from '../use-auth-store';

const INITIAL_STATE = useAuthStore.getState();

const SESSION = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-google', name: 'Google 太郎', iconUrl: '' },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(INITIAL_STATE);
  });

  describe('初期 state', () => {
    it('起動時は未ログイン（currentUser が null）', () => {
      expect(useAuthStore.getState().currentUser).toBeNull();
    });
  });

  describe('logout', () => {
    it('currentUser を null にする', () => {
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().currentUser).toBeNull();
    });

    it('トークンもすべて未設定に戻す', () => {
      useAuthStore.getState().setSession(SESSION);
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.currentUser).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('login', () => {
    it('渡したユーザーを currentUser に設定する', () => {
      const user = {
        id: 'user-yamada',
        name: '山田花子',
        iconUrl: 'https://example.com/hanako.png',
      };

      useAuthStore.getState().login(user);

      expect(useAuthStore.getState().currentUser).toEqual(user);
    });

    it('logout 後でも login で再度ログインできる', () => {
      const user = { id: 'user-sato', name: '佐藤太郎', iconUrl: 'https://example.com/taro.png' };

      useAuthStore.getState().logout();
      useAuthStore.getState().login(user);

      expect(useAuthStore.getState().currentUser).toEqual(user);
    });

    it('モックログインではトークンを設定しない', () => {
      useAuthStore.getState().setSession(SESSION);
      useAuthStore
        .getState()
        .login({ id: 'user-sato', name: '佐藤太郎', iconUrl: 'https://example.com/taro.png' });

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().refreshToken).toBeNull();
    });
  });

  describe('updateCurrentUser', () => {
    it('トークンを保ったまま currentUser のみ更新する', () => {
      useAuthStore.getState().setSession(SESSION);
      const updated = {
        id: 'user-google',
        name: '新しい名前',
        iconUrl: 'https://example.com/new.png',
      };

      useAuthStore.getState().updateCurrentUser(updated);

      const state = useAuthStore.getState();
      expect(state.currentUser).toEqual(updated);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });
  });

  describe('setSession', () => {
    it('ユーザーとトークンを設定する', () => {
      useAuthStore.getState().setSession(SESSION);

      const state = useAuthStore.getState();
      expect(state.currentUser).toEqual(SESSION.user);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });
  });
});
