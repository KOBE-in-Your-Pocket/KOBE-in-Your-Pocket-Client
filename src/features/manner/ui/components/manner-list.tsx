import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFilteredManners } from '../hooks/use-filtered-manners';

import { KIND_ACCENT_COLOR, KIND_CARD_BACKGROUND } from '../styles/kind-badge.styles';
import { styles } from '../styles/manner-list.styles';

import type { MannerItem } from '../../domain/manner-item';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { KindBadge } from './kind-badge';
import { KindFilter } from './kind-filter';
import { MannerPictogram } from './manner-pictogram';
import { ScopeFilter } from './scope-filter';

/**
 * マナー項目1件分のカード（2列グリッドの1セル）。
 *
 * 各カードは幅 50% 固定のセルに収める。幅は flex 分配ではなく明示指定のため、件数が奇数でも
 * 最後のカードが2列分に広がらず、常に1列分（半分）の幅を保つ。セル内でピクトグラムを大きく表示し、
 * その下にバッジ・タイトルを並べる。タップで詳細画面へ遷移する。
 */
function MannerCard({ manner }: { manner: MannerItem }) {
  const theme = useTheme();
  const accent = KIND_ACCENT_COLOR[manner.kind];

  return (
    <View style={styles.cell}>
      <Pressable
        style={[
          styles.card,
          { backgroundColor: KIND_CARD_BACKGROUND[manner.kind], borderColor: accent },
        ]}
        onPress={() => router.push({ pathname: '/manner/[id]', params: { id: manner.id } })}
        accessibilityRole="button"
        accessibilityLabel={manner.title}
      >
        <View style={[styles.pictogramWrapper, { backgroundColor: theme.backgroundElement }]}>
          <MannerPictogram manner={manner} size={72} />
        </View>
        <KindBadge kind={manner.kind} />
        <ThemedText style={[styles.itemTitle, { color: accent }]} numberOfLines={2}>
          {manner.title}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function ListHeader() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    // 一覧画面（Tourist Spots）と同じ装飾タイトル：筆記体・中央揃えのタイトルを上下の区切り線で挟む。
    <View style={[styles.header, { paddingTop: insets.top + Spacing.four + Spacing.one }]}>
      <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
      <ThemedText type="title" style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        {t('manner.list.title')}
      </ThemedText>
      <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
      <KindFilter />
      <ScopeFilter />
    </View>
  );
}

/**
 * マナー項目一覧を2列グリッドで表示するコンポーネント。
 *
 * application 層の `useFilteredManners()` 経由で選択中の種別・地域スコープに絞り込んだデータを
 * 取得し、各項目をピクトグラム主体のカードで並べる。カードをタップすると詳細画面（`/manner/[id]`）へ
 * 遷移する。上部の {@link KindFilter} と {@link ScopeFilter} で一覧が即座に更新される。
 */
export function MannerList() {
  const { t } = useTranslation();
  const { data: manners, isPending, isError } = useFilteredManners();

  if (isPending) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">{t('manner.list.loadError')}</ThemedText>
      </ThemedView>
    );
  }

  // 絞り込み結果が空でもヘッダーの KindFilter / ScopeFilter は表示し続け、他の条件へ切り替えられるようにする。
  return (
    <FlatList
      data={manners}
      keyExtractor={(manner) => manner.id}
      renderItem={({ item }) => <MannerCard manner={item} />}
      numColumns={2}
      ListHeaderComponent={<ListHeader />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <ThemedText themeColor="textSecondary">{t('manner.list.empty')}</ThemedText>
        </View>
      }
      contentContainerStyle={styles.listContent}
    />
  );
}
