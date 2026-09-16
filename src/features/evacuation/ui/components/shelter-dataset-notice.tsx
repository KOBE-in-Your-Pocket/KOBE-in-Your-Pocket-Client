import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useShelterDatasetMetadata } from '../../application/hooks/use-shelter-dataset-metadata';

import { Spacing } from '@/shared/config';
import { ThemedText } from '@/shared/ui';

/**
 * 避難所データの出典・データ基準日と免責を表示する。
 *
 * 避難所は災害時に参照される安全情報であり、アプリの表示が古い・不正確な場合に
 * 実害が出うる。「いつ時点の・どこのデータか」と「最新情報は自治体の発表を優先すること」を
 * 一覧と詳細の両方に明示する（App Store Guideline 1.1 / 5.1.5、#492）。
 *
 * 免責は常に出す。出典・基準日はまだ一度も同期できていない場合に限り出せないため、
 * そのときは行ごと省く（値の無い項目を「不明」と表示しない）。
 */
export function ShelterDatasetNotice() {
  const { t } = useTranslation();
  const { data: metadata } = useShelterDatasetMetadata();

  return (
    <View style={styles.container}>
      {metadata ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('evacuation.dataset.source', { source: metadata.source, asOf: metadata.asOf })}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {t('evacuation.dataset.disclaimer')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
});
