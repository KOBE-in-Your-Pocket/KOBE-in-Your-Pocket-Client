import { useQuery } from '@tanstack/react-query';

import { fetchWalkingRoute, type RouteCoordinate, type RouteResult } from '@/shared/lib/routing';

/** 経路取得系クエリのキー名前空間。 */
export const ROUTE_QUERY_KEY = ['map', 'route'] as const;

/** OpenRouteService の APIキー（クライアントに公開される EXPO_PUBLIC_ 変数）。 */
const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTESERVICE_API_KEY;

/**
 * 現在地 → 目的地の徒歩経路を取得する application 層フック。
 *
 * `origin` と `destination` が揃い、かつ APIキーが設定されているときだけ取得する。
 * 同じ区間は 5 分キャッシュし、ピンを連打しても無駄な再取得をしない。
 */
export function useRoute(
  origin: RouteCoordinate | null | undefined,
  destination: RouteCoordinate | null | undefined,
) {
  return useQuery<RouteResult>({
    queryKey: [...ROUTE_QUERY_KEY, origin, destination],
    enabled: Boolean(origin && destination && ORS_API_KEY),
    staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) =>
      // enabled で存在は保証済み。
      fetchWalkingRoute(origin as RouteCoordinate, destination as RouteCoordinate, {
        apiKey: ORS_API_KEY as string,
        signal,
      }),
  });
}
