import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeleteReview } from '../../application/use-delete-review';
import { type ReportOutcome, useReportReview } from '../../application/use-report-review';
import { useSpotReviews } from '../../application/use-spot-reviews';
import { useUpdateReview } from '../../application/use-update-review';

import type { Review } from '../../domain/review';
import type { Spot } from '../../domain/spot';
import type { ReviewReportInput } from '../../infrastructure/api/review-api';

import { useReportedReviewIds } from '../../store/use-reported-review-store';
import type { ReviewEdit } from '../../store/use-review-store';

import { RATING_STAR_COLOR, styles } from '../styles/spot-detail.styles';

import { ReviewForm } from './review-form';
import { ReportReviewModal } from './report-review-modal';
import { ReviewLanguageFilter, type ReviewLangFilter } from './review-language-filter';

import { SpotMannerSection } from '@/features/manner';
import { SignInModal, useCurrentUser, UserAvatar } from '@/features/user';
import { IS_USER_CONTENT_ENABLED, Spacing } from '@/shared/config';
import { confirmOpenDirections } from '@/shared/lib/directions';
import { useCurrentLocation } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { useIsAdult } from '@/shared/store';
import { DestructiveConfirmDialog, ThemedText, ThemedView } from '@/shared/ui';

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
  canReport,
  isAuthenticated,
  onUpdate,
  onDelete,
  onReport,
  onRequireSignIn,
}: {
  review: Review;
  isOwn: boolean;
  canReport: boolean;
  isAuthenticated: boolean;
  onUpdate: (changes: ReviewEdit) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onReport: (input: ReviewReportInput) => Promise<unknown>;
  onRequireSignIn: () => void;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const showMenu = (isOwn || canReport) && !isDeleting;

  const canSave = editRating > 0 && editComment.trim() !== '' && !isSaving;

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteFailed(false);
    try {
      await onDelete();
    } catch {
      setDeleteFailed(true);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleReportPress() {
    setMenuOpen(false);
    if (!isAuthenticated) {
      onRequireSignIn();
      return;
    }
    // Modal を閉じてから開く。同時だと iOS で競合して出ないため 100ms 待つ。
    setTimeout(() => setReportVisible(true), 100);
  }

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
          {showMenu && (
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
        {isDeleting && (
          <ThemedText type="small" themeColor="textSecondary">
            {t('tourism.reviewCard.deleting')}
          </ThemedText>
        )}
        {deleteFailed && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <ThemedText type="small" style={{ color: '#D45B45', flexShrink: 1 }}>
              {t('tourism.reviewCard.deleteError')}
            </ThemedText>
            <Pressable onPress={handleDelete} accessibilityRole="button">
              <ThemedText type="smallBold" style={{ color: '#D45B45' }}>
                {t('tourism.reviewCard.retry')}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ThemedView>

      {menuOpen && (
        <Modal transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <ThemedView
            type="backgroundElement"
            style={[dropdownStyles.menu, { top: menuPos.top, right: menuPos.right }]}
          >
            {isOwn ? (
              <>
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
                    // Modal を閉じてから確認を出す。同時だと iOS で競合して出ないため 100ms 待つ。
                    setTimeout(() => setDeleteConfirmVisible(true), 100);
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
              </>
            ) : (
              <Pressable style={dropdownStyles.item} onPress={handleReportPress}>
                <SymbolView
                  name={{ ios: 'flag', android: 'flag', web: 'flag' }}
                  tintColor="#D45B45"
                  size={16}
                />
                <ThemedText type="smallBold" style={{ color: '#D45B45' }}>
                  {t('tourism.reviewCard.report')}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </Modal>
      )}
      <DestructiveConfirmDialog
        visible={deleteConfirmVisible}
        title={t('tourism.reviewCard.deleteConfirmTitle')}
        message={t('tourism.reviewCard.deleteConfirmMessage')}
        cancelLabel={t('tourism.reviewCard.cancel')}
        confirmLabel={t('tourism.reviewCard.delete')}
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          void handleDelete();
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
      <ReportReviewModal
        visible={reportVisible}
        onCancel={() => setReportVisible(false)}
        onSubmit={onReport}
        onSubmitted={() => setReportVisible(false)}
      />
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
  const insets = useSafeAreaInsets();
  const { coords } = useCurrentLocation();
  const currentUser = useCurrentUser();
  const {
    data: reviews,
    isPending: isReviewsPending,
    refetch: refetchReviews,
  } = useSpotReviews(spot.id, currentUser);
  const [reviewLang, setReviewLang] = useState<ReviewLangFilter>('all');
  const isAdult = useIsAdult();
  const updateReview = useUpdateReview(spot.id);
  const deleteReview = useDeleteReview(spot.id);
  const reportReview = useReportReview(spot.id);
  const reportedReviewIds = useReportedReviewIds(currentUser?.id);
  const [signInVisible, setSignInVisible] = useState(false);
  const [reportNotice, setReportNotice] = useState<ReportOutcome | null>(null);
  // 背景の再取得ではくるくるを出さず、引っ張って更新したときだけ出す。
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchReviews();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchReviews]);

  const handleOpenDirections = useCallback(() => {
    confirmOpenDirections(t, spot.coordinates, { origin: coords });
  }, [spot.coordinates, coords, t]);

  const filteredReviews = (reviews ?? []).filter(
    (r) => (reviewLang === 'all' || r.language === reviewLang) && !reportedReviewIds.includes(r.id),
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          // 画面最上部から始まるため、そのままだとくるくるがステータスバー（Dynamic Island）の裏に隠れる。
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: spot.media.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
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
              <View
                style={[styles.sectionTitleDivider, { backgroundColor: theme.textSecondary }]}
              />
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                {t('tourism.spotDetail.reviews')}
              </ThemedText>
              <View
                style={[styles.sectionTitleDivider, { backgroundColor: theme.textSecondary }]}
              />
            </View>
            <ReviewForm spotId={spot.id} />
            <ReviewLanguageFilter value={reviewLang} onChange={setReviewLang} />
            {reportNotice && (
              <ThemedText type="small" themeColor="textSecondary">
                {t(
                  reportNotice === 'reported'
                    ? 'tourism.reportModal.reportedNotice'
                    : 'tourism.reportModal.notFoundNotice',
                )}
              </ThemedText>
            )}
            {isReviewsPending ? (
              <ActivityIndicator />
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((review) => {
                // 18歳未満・未投稿機能では編集/削除も出さない（#306）。
                const isOwn =
                  IS_USER_CONTENT_ENABLED && isAdult && review.author.id === currentUser?.id;
                // author.id が無いのは V17 以前の投稿だけで、本人の投稿ではあり得ないため通報対象にする。
                const canReport = IS_USER_CONTENT_ENABLED && isAdult && !isOwn;
                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    isOwn={isOwn}
                    canReport={canReport}
                    isAuthenticated={currentUser != null}
                    onUpdate={(changes) =>
                      updateReview.mutateAsync({ reviewId: review.id, changes })
                    }
                    onDelete={() => deleteReview.mutateAsync(review.id)}
                    onReport={async (input) => {
                      setReportNotice(
                        await reportReview.mutateAsync({ reviewId: review.id, ...input }),
                      );
                    }}
                    onRequireSignIn={() => setSignInVisible(true)}
                  />
                );
              })
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {t('tourism.spotDetail.noReviews')}
              </ThemedText>
            )}
          </View>
        </View>
      </ScrollView>
      <SignInModal visible={signInVisible} onClose={() => setSignInVisible(false)} />
    </>
  );
}
