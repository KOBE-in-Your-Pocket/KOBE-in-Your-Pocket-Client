import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { MODE_SELECTED_COLOR, Spacing } from '@/shared/config';
import { SegmentedControl } from '@/shared/ui';

import { useListModeStore, type ListMode } from '../../store/use-list-mode-store';

const LIST_MODES: ListMode[] = ['tourism', 'evacuation'];

export function ListModeToggle() {
  const { t } = useTranslation();
  const listMode = useListModeStore((state) => state.listMode);
  const setListMode = useListModeStore((state) => state.setListMode);

  const segments = LIST_MODES.map((mode) => ({
    value: mode,
    label: t(`list.modeToggle.${mode}`),
    selectedColor: MODE_SELECTED_COLOR[mode],
  }));

  return (
    <View style={styles.container}>
      <SegmentedControl
        segments={segments}
        value={listMode}
        onChange={setListMode}
        segmentMinWidth={72}
        elevated={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.three,
    // 右下・下部タブのすぐ上に固定。画面スクロールに追従せず常に同じ位置に表示する。
    bottom: Spacing.four,
    zIndex: 1,
  },
});
