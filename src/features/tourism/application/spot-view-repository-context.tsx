import { createContext, useContext, type PropsWithChildren } from 'react';

import type { SpotViewRepository } from '../domain/spot-view';

const SpotViewRepositoryContext = createContext<SpotViewRepository | null>(null);

/**
 * {@link SpotViewRepository} の具体実装を注入する Provider（#834）。
 *
 * composition root（`src/app/_layout.tsx`）で実装を渡すことで、application / ui 層は infrastructure を
 * 直接 import せずに済み、`ui → application → domain ◄─ infrastructure` の依存方向を保てる。
 */
export function SpotViewRepositoryProvider({
  repository,
  children,
}: PropsWithChildren<{ repository: SpotViewRepository }>) {
  return (
    <SpotViewRepositoryContext.Provider value={repository}>
      {children}
    </SpotViewRepositoryContext.Provider>
  );
}

/** 注入された {@link SpotViewRepository} を取得する。Provider 外で使うと例外を投げる。 */
export function useSpotViewRepository(): SpotViewRepository {
  const repository = useContext(SpotViewRepositoryContext);
  if (!repository) {
    throw new Error(
      'useSpotViewRepository は SpotViewRepositoryProvider の内側で使用してください。',
    );
  }
  return repository;
}
