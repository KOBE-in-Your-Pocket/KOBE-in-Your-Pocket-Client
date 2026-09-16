import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeleteReview } from '../../application/use-delete-review';
import { useSpotReviews } from '../../application/use-spot-reviews';
import { useUpdateReview } from '../../application/use-update-review';

import type { Review } from '../../domain/review';
import type { Spot } from '../../domain/spot';

import type { ReviewEdit } from '../../store/use-review-store';

import { RATING_STAR_COLOR, styles } from '../styles/spot-detail.styles';

import { ReviewForm } from './review-form';
import { ReviewLanguageFilter, type ReviewLangFilter } from './review-language-filter';

import { SpotMannerSection } from '@/features/manner';
import { useCurrentUser, UserAvatar } from '@/features/user';
import { IS_USER_CONTENT_ENABLED, Spacing } from '@/shared/config';
import { confirmOpenDirections } from '@/shared/lib/directions';
import { useCurrentLocation } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { useIsAdult } from '@/shared/store';
import { ThemedText, ThemedView } from '@/shared/ui';

function BackButton({ label }: { label: string }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.backButton, { top: insets.top + Spacing.two }]}
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
    >
      <SymbolView
        tintColor="#FFFFFF"
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={20}
      />
    </Pressable>
  );
}

const MAX_STAR = 5;
const REVIEW_AVATAR_SIZE = 36;

function ReviewCard({
  review,
  isOwn,
  onUpdate,
  onDelete,
}: {
  review: Review;
  isOwn: boolean;
  /** 保存は backend への PUT。完了を待って編集モードを閉じるため Promise を返す。 */
  onUpdate: (changes: ReviewEdit) => Promise<unknown>;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const menuAnchorRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating.value);
  const [editComment, setEditComment] = useState(review.comment);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const canSave = editRating > 0 && editComment.trim() !== '' && !isSaving;

  function openMenu() {
    menuAnchorRef.current?.measureInWindow((x, _y, w, h) => {
      setMenuPos({ top: _y + h + 4, right: screenWidth - x - w });
      setMenuOpen(true);
    });
  }

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setSaveFailed(false);
    try {
      // 保存が確定するまで編集モードを閉じない（失敗しても入力し直しにならないように）。
      await onUpdate({ rating: { value: editRating }, comment: editComment.trim() });
      setEditing(false);
    } catch {
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setEditRating(review.rating.value);
    setEditComment(review.comment);
    setSaveFailed(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <ThemedView type="backgroundElement" style={styles.reviewCard}>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {Array.from({ length: MAX_STAR }, (_, i) => (
            <Pressable
              key={i}
              onPress={() => setEditRating(i + 1)}
              accessibilityRole="button"
              accessibilityLabel={t('tourism.reviewForm.starLabel', { count: i + 1 })}
            >
              <SymbolView
                name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                tintColor={i < editRating ? '#F5A623' : '#D8D8D8'}
                size={24}
              />
            </Pressable>
          ))}
        </View>
        <TextInput
          style={[
            styles.reviewComment,
            {
              backgroundColor: theme.background,
              color: theme.text,
              padding: Spacing.two,
              borderRadius: 8,
              minHeight: 72,
              textAlignVertical: 'top',
            },
          ]}
          value={editComment}
          onChangeText={setEditComment}
          multiline
          autoFocus
        />
        {saveFailed && (
          <ThemedText type="small" style={{ color: '#D45B45' }}>
            {t('tourism.reviewCard.saveError')}
          </ThemedText>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two }}>
          <Pressable
            style={{
              paddingVertical: Spacing.two,
              paddingHorizontal: Spacing.three,
              borderRadius: 8,
              backgroundColor: theme.backgroundSelected,
            }}
            onPress={handleCancel}
            disabled={isSaving}
            accessibilityRole="button"
          >
            <ThemedText type="smallBold">{t('tourism.reviewForm.cancel')}</ThemedText>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: Spacing.two,
              paddingHorizontal: Spacing.three,
              borderRadius: 8,
              backgroundColor: canSave ? '#D45B45' : theme.backgroundSelected,
            }}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <ThemedText
              type="smallBold"
              style={{ color: canSave ? '#FFFFFF' : theme.textSecondary }}
            >
              {t(isSaving ? 'tourism.reviewCard.saving' : 'tourism.reviewCard.save')}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <>
      <ThemedView type="backgroundElement" style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <UserAvatar iconUrl={review.author.iconUrl} size={REVIEW_AVATAR_SIZE} />
          <ThemedText type="smallBold" style={styles.reviewAuthor} numberOfLines={1}>
            {review.author.name}
          </ThemedText>
          <View style={styles.ratingRow}>
            <SymbolView
              tintColor={RATING_STAR_COLOR}
              name={{ ios: 'star.fill', android: 'star', web: 'star' }}
              size={14}
            />
            <ThemedText type="smallBold">{review.rating.value.toFixed(1)}</ThemedText>
          </View>
          {isOwn && (
            <View ref={menuAnchorRef}>
              <Pressable
                onPress={openMenu}
                accessibilityRole="button"
                accessibilityLabel={t('tourism.reviewCard.openMenu')}
                hitSlop={Spacing.two}
              >
                <SymbolView
                  name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
                  tintColor={theme.textSecondary}
                  size={18}
                />
              </Pressable>
            </View>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.reviewComment}>
          {review.comment}
        </ThemedText>
      </ThemedView>

      {menuOpen && (
        <Modal transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <ThemedView
            type="backgroundElement"
            style={[dropdownStyles.menu, { top: menuPos.top, right: menuPos.right }]}
          >
            <Pressable
              style={dropdownStyles.item}
              onPress={() => {
                setMenuOpen(false);
                setEditing(true);
              }}
            >
              <SymbolView
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                tintColor={theme.text}
                size={16}
              />
              <ThemedText type="smallBold">{t('tourism.reviewCard.edit')}</ThemedText>
            </Pressable>
            <Pressable
              style={dropdownStyles.item}
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                tintColor="#D45B45"
                size={16}
              />
              <ThemedText type="smallBold" style={{ color: '#D45B45' }}>
                {t('tourism.reviewCard.delete')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Modal>
      )}
    </>
  );
}

const dropdownStyles = StyleSheet.create({
  menu: {
    position: 'absolute',
    borderRadius: 10,
    minWidth: 140,
    paddingVertical: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});

/**
 * 取得済みスポットの詳細 UI（ヒーロー画像・基本情報・マナー・レビュー）を表示する。
 */
export function SpotDetailContent({ spot }: { spot: Spot }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { coords } = useCurrentLocation();
  const { data: reviews, isPending: isReviewsPending } = useSpotReviews(spot.id);
  const [reviewLang, setReviewLang] = useState<ReviewLangFilter>('all');
  const currentUser = useCurrentUser();
  const isAdult = useIsAdult();
  const updateReview = useUpdateReview(spot.id);
  const deleteReview = useDeleteReview(spot.id);

  const handleOpenDirections = useCallback(() => {
    confirmOpenDirections(t, spot.coordinates, { origin: coords });
  }, [spot.coordinates, coords, t]);

  const filteredReviews =
    reviewLang === 'all'
      ? (reviews ?? [])
      : (reviews ?? []).filter((r) => r.language === reviewLang);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <Image source={{ uri: spot.media.imageUrl }} style={styles.heroImage} contentFit="cover" />
        <BackButton label={t('tourism.spotDetail.back')} />
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <ThemedText style={styles.category}>{spot.category.label}</ThemedText>
          {spot.rating ? (
            <View style={styles.ratingRow}>
              <SymbolView
                tintColor={RATING_STAR_COLOR}
                name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                size={14}
              />
              <ThemedText type="smallBold">{spot.rating.value.toFixed(1)}</ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText type="subtitle" style={styles.name}>
          {spot.name}
        </ThemedText>

        <View style={styles.hoursRow}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            size={14}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {spot.businessHours}
          </ThemedText>
        </View>

        <ThemedText themeColor="textSecondary" style={styles.description}>
          {spot.description}
        </ThemedText>

        <Pressable
          style={styles.routeButton}
          onPress={handleOpenDirections}
          accessibilityRole="button"
          accessibilityLabel={t('tourism.spotDetail.openDirectionsButton')}
        >
          <SymbolView
            tintColor="#FFFFFF"
            name={{
              ios: 'arrow.triangle.turn.up.right.diamond.fill',
              android: 'directions',
              web: 'directions',
            }}
            size={16}
          />
          <ThemedText style={styles.routeButtonText}>
            {t('tourism.spotDetail.openDirectionsButton')}
          </ThemedText>
        </Pressable>

        <SpotMannerSection spotId={spot.id} />

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionTitleDivider, { backgroundColor: theme.textSecondary }]} />
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              {t('tourism.spotDetail.reviews')}
            </ThemedText>
            <View style={[styles.sectionTitleDivider, { backgroundColor: theme.textSecondary }]} />
          </View>
          <ReviewForm spotId={spot.id} />
          <ReviewLanguageFilter value={reviewLang} onChange={setReviewLang} />
          {isReviewsPending ? (
            <ActivityIndicator />
          ) : filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                // v1 は閲覧のみ（#306）。投稿できない以上、編集・削除メニューも出さない。
                // 18歳未満も同様に投稿できないため、メニューを出す条件から外す。
                isOwn={IS_USER_CONTENT_ENABLED && isAdult && review.author.id === currentUser?.id}
                onUpdate={(changes) => updateReview.mutateAsync({ reviewId: review.id, changes })}
                onDelete={() => deleteReview(review.id)}
              />
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              {t('tourism.spotDetail.noReviews')}
            </ThemedText>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
