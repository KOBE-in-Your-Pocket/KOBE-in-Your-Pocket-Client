import { renderHook } from '@testing-library/react-native';

import { useAuthStore } from '../../store/use-auth-store';
import { useCurrentUser } from '../use-current-user';

const INITIAL_STATE = useAuthStore.getState();

describe('useCurrentUser', () => {
  beforeEach(() => {
    useAuthStore.setState(INITIAL_STATE);
  });

  it('未ログイン（初期状態）は null を返す', () => {
    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeNull();
  });

  it('login 後は認証ストアの現在ユーザー（name / iconUrl）を返す', () => {
    const user = { id: 'user-yamada', name: '山田花子', iconUrl: 'https://example.com/hanako.png' };
    useAuthStore.getState().login(user);

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(user);
    expect(result.current?.iconUrl).toMatch(/^https?:\/\//);
  });

  it('logout 後は null を返す', () => {
    useAuthStore
      .getState()
      .login({ id: 'user-yamada', name: '山田花子', iconUrl: 'https://example.com/hanako.png' });
    useAuthStore.getState().logout();

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeNull();
  });
});
