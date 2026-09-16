import type { TFunction } from 'i18next';
import { Alert, Platform } from 'react-native';

import { openDirections, type DirectionsCoordinate } from './open-directions';

/** 外部地図アプリ起動前の確認ダイアログを表示し、承認時に経路案内を開く。 */
export function confirmOpenDirections(
  t: TFunction,
  destination: DirectionsCoordinate,
  options: { origin?: DirectionsCoordinate | null } = {},
): void {
  const mapAppName =
    Platform.OS === 'ios' ? t('map.openDirections.appleMaps') : t('map.openDirections.googleMaps');

  Alert.alert(
    t('map.openDirections.confirmTitle'),
    t('map.openDirections.confirmMessage', { mapAppName }),
    [
      { text: t('map.openDirections.cancel'), style: 'cancel' },
      {
        text: t('map.openDirections.confirm'),
        onPress: () => {
          openDirections(destination, { origin: options.origin, mode: 'walking' }).catch(() => {
            Alert.alert(t('map.openDirections.errorTitle'), t('map.openDirections.errorMessage'));
          });
        },
      },
    ],
  );
}
