import { QueryClient } from '@tanstack/react-query';

/**
 * アプリ全体で共有する TanStack Query の QueryClient。
 *
 * 各 feature の ui/hooks（useQuery / useMutation）はこの単一インスタンスを
 * 経由してサーバー状態をキャッシュする。Provider への接続は AppProviders が担う。
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 分間は再フェッチせずキャッシュを利用する
        retry: 2,
      },
    },
  });
}
