import { createContext, useContext, type PropsWithChildren } from 'react';

import type { MannerRepository } from '../domain/manner-repository';

const MannerRepositoryContext = createContext<MannerRepository | null>(null);

/**
 * {@link MannerRepository} の具体実装を注入する Provider。
 *
 * composition root（`src/app` 側）で実装を渡すことで、application / ui 層は infrastructure を
 * 直接 import せずに済み、`ui → application → domain ◄─ infrastructure` の依存方向を保てる。
 */
export function MannerRepositoryProvider({
  repository,
  children,
}: PropsWithChildren<{ repository: MannerRepository }>) {
  return (
    <MannerRepositoryContext.Provider value={repository}>
      {children}
    </MannerRepositoryContext.Provider>
  );
}

/** 注入された {@link MannerRepository} を取得する。Provider 外で使うと例外を投げる。 */
export function useMannerRepository(): MannerRepository {
  const repository = useContext(MannerRepositoryContext);
  if (!repository) {
    throw new Error('useMannerRepository は MannerRepositoryProvider の内側で使用してください。');
  }
  return repository;
}
