import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  EvacuationShelterCard,
  filterSheltersWithinRadius,
  useEvacuationShelters,
} from '@/features/evacuation';
import type { EvacuationShelter } from '@/features/evacuation';
import type { Spot } from '@/features/tourism';
import { useSpots } from '@/features/tourism';
import { confirmOpenDirections } from '@/shared/lib/directions';
import { getDistanceKm, useCurrentLocation } from '@/shared/lib/geo';
import { LocationServicesModal, Map, ThemedView } from '@/shared/ui';
import type { MapMarker } from '@/shared/ui';

import { useRoute } from '../../application/use-route';
import { useMapModeStore } from '../../store/use-map-mode-store';
import { styles } from '../styles/map-screen.styles';
import { MapModeToggle } from './map-mode-toggle';
import { RouteAttribution } from './route-attribution';
import { SpotCard } from './spot-card';

export function MapScreen() {
  const { t } = useTranslation();
  const { coords, servicesDisabled, permissionDenied } = useCurrentLocation();
  const mapMode = useMapModeStore((state) => state.mapMode);
  const setMapMode = useMapModeStore((state) => state.setMapMode);
  const { data: spots } = useSpots();
  const { data: shelters } = useEvacuationShelters();
  const { spotId, requestedAt } = useLocalSearchParams<{ spotId?: string; requestedAt?: string }>();
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<EvacuationShelter | null>(null);
  const [appliedSpotRequest, setAppliedSpotRequest] = useState<string | undefined>(undefined);
  const [showServicesModal, setShowServicesModal] = useState(false);

  // 一度でも現在地が取れたあとに、位置情報が使えなくなった瞬間だけモーダルを開く。
  // iOS ではサービスのグローバルオフが権限拒否として返ることもあるため、
  // servicesDisabled / permissionDenied のどちらでもオフとして扱う。
  // オフの間は coords が null になり、現在地ピンは地図上から消える。
  const wasLocationAvailable = useRef(false);
  useEffect(() => {
    if (coords) {
      wasLocationAvailable.current = true;
      return;
    }
    if ((servicesDisabled || permissionDenied) && wasLocationAvailable.current) {
      setShowServicesModal(true);
    }
  }, [coords, servicesDisabled, permissionDenied]);

  const handleCloseServicesModal = useCallback(() => {
    setShowServicesModal(false);
  }, []);

  // 現在地から半径 1km 以内の避難所だけを地図に出す（#594）。マーカーと選択解除判定で共有する。
  const visibleShelters = useMemo(
    () => filterSheltersWithinRadius(shelters ?? [], coords),
    [shelters, coords],
  );

  // 地図モードに応じて表示するピンを出し分ける。
  // tourism: 観光名所（useSpots）／evacuation: 避難所（useEvacuationShelters）。
  // mapMode は zustand ストアなので、モード切替で即座に markers が再計算・再描画される。
  const markers = useMemo<MapMarker[]>(() => {
    if (mapMode === 'evacuation') {
      return visibleShelters.map((shelter) => ({
        id: shelter.id,
        coordinate: shelter.coordinates,
        title: shelter.name,
        description: shelter.address,
        variant: 'evacuation',
      }));
    }
    return (spots ?? []).map((spot) => ({
      id: spot.id,
      coordinate: spot.coordinates,
      title: spot.name,
    }));
  }, [mapMode, spots, visibleShelters]);

  // 観光地リストの「経路」ボタンから spotId 付きで遷移してきたら、その地点を選択状態にする。
  // render 中に前回適用した遷移と比較して反映する（effect 内 setState を避ける公式パターン）。
  // 地図タブはマウントされたままなので、spotId だけで比較すると同じスポットへの再遷移
  // （カードを閉じたあとにもう一度「経路」を押す等）が適用済み扱いになりカードが出ない。
  // そのため遷移ごとに変わる requestedAt と組み合わせ、押下のたびに一度だけ適用する。
  // spots が後から読み込まれた場合も、該当スポットが見つかった時点で一度だけ適用される。
  // spotId は観光導線からのみ渡るため、観光モードのときだけ適用する（避難モードのままなら下の effect が切り替える）。
  const spotRequest = spotId ? `${spotId}:${requestedAt ?? ''}` : undefined;
  if (mapMode === 'tourism' && spotRequest && spotRequest !== appliedSpotRequest) {
    const spot = spots?.find((candidate) => candidate.id === spotId);
    if (spot) {
      setAppliedSpotRequest(spotRequest);
      setSelectedSpot(spot);
    }
  }

  // 避難モードのまま残っていても選択できるよう観光モードへ切り替える。他コンポーネントも見るストアの
  // 更新なので render 中ではなく effect で行う（render 中だと React が警告を出す）。
  useEffect(() => {
    if (mapMode !== 'tourism' && spotRequest && spotRequest !== appliedSpotRequest) {
      setMapMode('tourism');
    }
  }, [mapMode, spotRequest, appliedSpotRequest, setMapMode]);

  // モード切替時は前モードの選択を解除する（保持すると戻ったとき未操作のカードが再表示されるため）。
  if (mapMode !== 'tourism' && selectedSpot !== null) {
    setSelectedSpot(null);
  }
  if (mapMode !== 'evacuation' && selectedShelter !== null) {
    setSelectedShelter(null);
  }

  // 現在地更新などで選択中の避難所が 1km 圏外（表示対象外）になったら選択を解除する。
  // 地図にピンが無い避難所をカード・経路が指し続ける不整合を防ぐ（#594）。
  if (
    mapMode === 'evacuation' &&
    selectedShelter !== null &&
    !visibleShelters.some((shelter) => shelter.id === selectedShelter.id)
  ) {
    setSelectedShelter(null);
  }

  // 経路の目的地は現在モードの選択地点（観光=スポット / 避難=避難所）。
  const routeDestination =
    mapMode === 'tourism' ? selectedSpot?.coordinates : selectedShelter?.coordinates;
  const { data: route } = useRoute(coords, routeDestination);

  const selectedDistanceKm = useMemo(() => {
    if (!selectedSpot || !coords) return null;
    return getDistanceKm(
      { latitude: coords.latitude, longitude: coords.longitude },
      selectedSpot.coordinates,
    );
  }, [coords, selectedSpot]);

  const handleMarkerPress = useCallback(
    (marker: MapMarker) => {
      if (mapMode === 'evacuation') {
        const shelter = shelters?.find((candidate) => candidate.id === marker.id);
        if (shelter) setSelectedShelter(shelter);
        return;
      }
      const spot = spots?.find((candidate) => candidate.id === marker.id);
      if (spot) setSelectedSpot(spot);
    },
    [mapMode, spots, shelters],
  );

  const handleClearRoute = useCallback(() => {
    setSelectedSpot(null);
  }, []);

  const handleClearShelter = useCallback(() => {
    setSelectedShelter(null);
  }, []);

  const handleOpenDetail = useCallback(() => {
    if (!selectedSpot) return;
    router.push({ pathname: '/tourism/[id]', params: { id: selectedSpot.id } });
  }, [selectedSpot]);

  const handleOpenShelterDetail = useCallback(() => {
    if (!selectedShelter) return;
    router.push({ pathname: '/evacuation/[id]', params: { id: selectedShelter.id } });
  }, [selectedShelter]);

  const handleStartNavigation = useCallback(() => {
    if (!selectedSpot) return;
    confirmOpenDirections(t, selectedSpot.coordinates, { origin: coords });
  }, [selectedSpot, coords, t]);

  return (
    <ThemedView style={styles.container}>
      <Map
        style={styles.map}
        currentLocation={coords}
        markers={markers}
        onMarkerPress={handleMarkerPress}
        routeCoordinates={route?.coordinates}
      />

      <MapModeToggle />

      {/* 経路を描画しているときだけ OSM / ORS の帰属表示を出す（ODbL）。 */}
      {route?.coordinates ? <RouteAttribution /> : null}

      {mapMode === 'tourism' && selectedSpot ? (
        <SpotCard
          spot={selectedSpot}
          distanceKm={selectedDistanceKm}
          onClose={handleClearRoute}
          onDetail={handleOpenDetail}
          onNavigate={handleStartNavigation}
        />
      ) : null}

      {mapMode === 'evacuation' && selectedShelter ? (
        <EvacuationShelterCard
          shelter={selectedShelter}
          currentLocation={coords}
          onClose={handleClearShelter}
          onDetail={handleOpenShelterDetail}
        />
      ) : null}

      <LocationServicesModal visible={showServicesModal} onClose={handleCloseServicesModal} />
    </ThemedView>
  );
}
