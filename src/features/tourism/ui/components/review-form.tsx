import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { useSubmitReview } from '../../application/use-submit-review';

import { ACTIVE_STAR_COLOR, INACTIVE_STAR_COLOR, styles } from '../styles/review-form.styles';

import { useCurrentUser } from '@/features/user/application/use-current-user';
import { IS_USER_CONTENT_ENABLED } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { useIsAdult } from '@/shared/store';
import { ThemedText, ThemedView } from '@/shared/ui';

const MAX_RATING = 5;

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: MAX_RATING }, (_, i) => (
        <Pressable
          key={i}
          style={styles.starButton}
          onPress={() => onChange(i + 1)}
          accessibilityRole="button"
          accessibilityLabel={t('tourism.reviewForm.starLabel', { count: i + 1 })}
        >
          <SymbolView
            name={{ ios: 'star.fill', android: 'star', web: 'star' }}
            tintColor={i < value ? ACTIVE_STAR_COLOR : INACTIVE_STAR_COLOR}
            size={28}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function ReviewForm({ spotId }: { spotId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const submitReview = useSubmitReview(spotId);
  const currentUser = useCurrentUser();
  const isAdult = useIsAdult();

  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // 現在ユーザーが変わったら（ログアウト／別ユーザーへの切替）書きかけの下書きを破棄する。
  // 前のユーザーの入力を次のユーザーへ持ち越さないため（同名ユーザーも id で区別する）。
  // 副作用ではなくレンダー中の「変化に伴う state 調整」で行う（React 推奨）。
  const currentUserId = currentUser?.id ?? null;
  const [draftOwnerId, setDraftOwnerId] = useState(currentUserId);
  if (draftOwnerId !== currentUserId) {
    setDraftOwnerId(currentUserId);
    setExpanded(false);
    setRating(0);
    setComment('');
  }

  const isSubmitting = submitReview.isPending;
  const canSubmit = rating > 0 && comment.trim() !== '' && !isSubmitting;

  function handleSubmit() {
    if (!canSubmit) return;
    // 投稿はネットワーク越しなので、成功が確定するまで入力内容は消さない
    // （失敗したときに書き直しにならないようにする）。
    submitReview.mutate(
      { rating: { value: rating }, comment: comment.trim() },
      {
        onSuccess: () => {
          setRating(0);
          setComment('');
          setExpanded(false);
        },
      },
    );
  }

  function handleCancel() {
    submitReview.reset();
    setRating(0);
    setComment('');
    setExpanded(false);
  }

  // v1 では投稿機能そのものを出さない（#306）。案内も出さず、レビューは閲覧のみになる。
  // 18歳未満にも出さない（子供の個人情報を扱わないため）。どちらの場合も閲覧はできる。
  if (!IS_USER_CONTENT_ENABLED || !isAdult) {
    return null;
  }

  // 未ログイン時はレビュー投稿できないため、ログインを促す案内を表示する（#400）。
  if (!currentUser) {
    return (
      <ThemedView type="backgroundElement" style={styles.loginNotice}>
        <ThemedText themeColor="textSecondary">{t('tourism.reviewForm.loginRequired')}</ThemedText>
      </ThemedView>
    );
  }

  if (!expanded) {
    return (
      <Pressable
        style={[styles.trigger, { backgroundColor: theme.backgroundElement }]}
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={t('tourism.reviewForm.placeholder')}
      >
        <Image
          source={{ uri: currentUser.iconUrl }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
          contentFit="cover"
        />
        <ThemedText themeColor="textSecondary" style={styles.triggerText}>
          {t('tourism.reviewForm.placeholder')}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.form}>
      <StarInput value={rating} onChange={setRating} />

      <TextInput
        style={[styles.textInput, { backgroundColor: theme.background, color: theme.text }]}
        placeholder={t('tourism.reviewForm.commentPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        value={comment}
        onChangeText={setComment}
        multiline
        autoFocus
      />

      {submitReview.isError && (
        <ThemedText type="small" style={styles.errorText}>
          {t('tourism.reviewForm.submitError')}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.backgroundSelected }]}
          onPress={handleCancel}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          <ThemedText type="smallBold">{t('tourism.reviewForm.cancel')}</ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: canSubmit ? '#D45B45' : theme.backgroundSelected },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
        >
          <ThemedText
            type="smallBold"
            style={{ color: canSubmit ? '#FFFFFF' : theme.textSecondary }}
          >
            {t(isSubmitting ? 'tourism.reviewForm.submitting' : 'tourism.reviewForm.submit')}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
