import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { MODE_SELECTED_COLOR } from '@/shared/config';
import { SegmentedControl } from '@/shared/ui';

import { useMapModeStore, type MapMode } from '../../store/use-map-mode-store';

import { styles } from '../styles/map-mode-toggle.styles';

const MAP_MODES: MapMode[] = ['tourism', 'evacuation'];

export function MapModeToggle() {
  const { t } = useTranslation();
  const mapMode = useMapModeStore((state) => state.mapMode);
  const setMapMode = useMapModeStore((state) => state.setMapMode);

  const segments = MAP_MODES.map((mode) => ({
    value: mode,
    label: t(`map.modeToggle.${mode}`),
    selectedColor: MODE_SELECTED_COLOR[mode],
  }));

  return (
    <View style={styles.container}>
      <SegmentedControl
        segments={segments}
        value={mapMode}
        onChange={setMapMode}
        segmentMinWidth={56}
        elevated={false}
      />
    </View>
  );
}
