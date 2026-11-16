import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignInModal, useCurrentUser } from '@/features/user';
import { Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

import { useFavoriteSpots } from '../../application/use-favorite-spots';
import { ACCENT_COLOR, styles } from '../styles/favorites-screen.styles';

import { SpotListItem, type SpotWithDistance } from './spot-list-item';

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    // URL から直接開いたときなど、戻り先が無ければ入口の設定画面へ。
    router.replace('/(tabs)/settings');
  }
}

function Header() {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={goBack}
        hitSlop={Spacing.two}
        style={styles.backRow}
      >
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          tintColor={ACCENT_COLOR}
          size={18}
        />
        <ThemedText style={styles.backLabel}>{t('common.back')}</ThemedText>
      </Pressable>
      <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
        {t('tourism.favorite.list.title')}
      </ThemedText>
    </View>
  );
}

/** 一覧の代わりに出す案内（未ログイン・0 件・エラー）。ボタンは任意。 */
function Notice({
  message,
  hint,
  buttonLabel,
  onPress,
}: {
  message: string;
  hint?: string;
  buttonLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.notice}>
      <ThemedText type="smallBold" style={styles.noticeText}>
        {message}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.noticeText}>
          {hint}
        </ThemedText>
      ) : null}
      {buttonLabel && onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.noticeButton, pressed && styles.pressed]}
        >
          <ThemedText style={styles.noticeButtonText}>{buttonLabel}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

function SignedOutNotice() {
  const { t } = useTranslation();
  const [signInVisible, setSignInVisible] = useState(false);

  return (
    <>
      <Notice
        message={t('tourism.favorite.list.signInPrompt')}
        buttonLabel={t('tourism.favorite.list.signIn')}
        onPress={() => setSignInVisible(true)}
      />
      {signInVisible ? <SignInModal visible onClose={() => setSignInVisible(false)} /> : null}
    </>
  );
}

function FavoriteSpotList() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useFavoriteSpots();
  // 背景の再取得ではくるくるを出さず、引っ張って更新したときだけ出す（観光一覧と同じ）。
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // 距離のバッジは出さない。現在地を取りに行くと、設定から開いたこの画面で
  // 位置情報の許可を求めることになるため。並びも登録の新しい順のまま。
  const items = useMemo(
    (): SpotWithDistance[] | undefined => data?.map((spot) => ({ ...spot, distanceKm: null })),
    [data],
  );

  if (isError) {
    return (
      <Notice
        message={t('tourism.favorite.list.loadError')}
        buttonLabel={t('tourism.favorite.list.retry')}
        onPress={() => void refetch()}
      />
    );
  }

  if (isPending || !items) {
    return (
      <View style={styles.notice}>
        <ActivityIndicator />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <Notice
        message={t('tourism.favorite.list.empty')}
        hint={t('tourism.favorite.list.emptyHint')}
        buttonLabel={t('tourism.favorite.list.browseSpots')}
        // push だと (tabs) が積み上がる（#802）ため、navigate で既存の (tabs) に戻す。
        onPress={() => router.navigate('/tourism')}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(spot) => spot.id}
      renderItem={({ item }) => <SpotListItem spot={item} />}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    />
  );
}

/**
 * 自分のお気に入り一覧の画面（#795）。設定のアカウント欄から開く。
 *
 * 行は観光一覧と同じ {@link SpotListItem}。押すと観光詳細へ移り、♡ で解除すると
 * その場で一覧から消える（楽観的更新。失敗したら戻る）。
 *
 * 入口はログイン中にしか出ないが、URL から直接開いたときのために未ログインの案内も出す。
 * ログインの導線が無いとき（ユーザー投稿の停止中・18 歳未満）はルート側で塞ぐ。
 */
export function FavoritesScreen() {
  const isSignedIn = !!useCurrentUser();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header />
        {isSignedIn ? <FavoriteSpotList /> : <SignedOutNotice />}
      </SafeAreaView>
    </ThemedView>
  );
}
