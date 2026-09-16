/** 経路の地点（緯度経度）。 */
export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

/** 取得した経路の結果。 */
export type RouteResult = {
  /** 経路を構成する座標列（描画用）。 */
  coordinates: RouteCoordinate[];
  /** 総距離（メートル）。 */
  distanceMeters: number;
  /** 所要時間（秒）。 */
  durationSeconds: number;
};

/** OpenRouteService の GeoJSON レスポンス（必要な部分のみ）。 */
export type OrsGeoJson = {
  features?: {
    geometry?: { coordinates?: [number, number][] };
    properties?: { summary?: { distance?: number; duration?: number } };
  }[];
};

const ORS_DIRECTIONS_BASE = 'https://api.openrouteservice.org/v2/directions';

/**
 * OpenRouteService の GeoJSON を描画用の {@link RouteResult} に変換する。
 * ORS は座標を [経度, 緯度] の順で返すため、緯度経度に並べ替える。
 */
export function parseOrsGeoJson(json: OrsGeoJson): RouteResult {
  const feature = json.features?.[0];
  const rawCoordinates = feature?.geometry?.coordinates ?? [];
  const summary = feature?.properties?.summary ?? {};

  return {
    coordinates: rawCoordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
    distanceMeters: summary.distance ?? 0,
    durationSeconds: summary.duration ?? 0,
  };
}

export type FetchRouteOptions = {
  apiKey: string;
  signal?: AbortSignal;
};

/**
 * OpenRouteService で現在地 → 目的地の徒歩経路を取得する。
 * 道なりの座標列・距離・所要時間を返す。
 */
export async function fetchWalkingRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  { apiKey, signal }: FetchRouteOptions,
): Promise<RouteResult> {
  const url =
    `${ORS_DIRECTIONS_BASE}/foot-walking` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&start=${origin.longitude},${origin.latitude}` +
    `&end=${destination.longitude},${destination.latitude}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`経路の取得に失敗しました (HTTP ${response.status})`);
  }

  const json = (await response.json()) as OrsGeoJson;
  return parseOrsGeoJson(json);
}
