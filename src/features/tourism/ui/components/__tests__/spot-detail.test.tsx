import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  Pressable as MockPressable,
  Text as MockText,
  View as MockView,
  View as RNView,
} from 'react-native';

import { SpotDetailContent } from '../spot-detail';

import { useAgeRestrictionStore } from '@/shared/store';

import { useReportedReviewStore } from '../../../store/use-reported-review-store';

import type { Spot } from '../../../domain/spot';
import type { ReactNode } from 'react';

const mockSpot: Spot = {
  id: 'nankinmachi',
  name: '南京町',
  description: '神戸の中華街。',
  address: '兵庫県神戸市中央区栄町通',
  businessHours: '10:00 - 20:00',
  genre: 'gourmet',
  category: { label: 'グルメ' },
  media: { imageUrl: 'https://example.com/nankinmachi.jpg' },
  coordinates: { latitude: 34.6889, longitude: 135.1877 },
  rating: { value: 4.2 },
};

const mockSpotMannerSection = jest.fn((_props: { spotId: string }) => null);
const mockUseSpotReviews = jest.fn();
const mockUseCurrentUser = jest.fn();
const mockUseCurrentLocation = jest.fn();
const mockUpdateReviewAsync = jest.fn();
const mockDeleteReviewAsync = jest.fn();
const mockReportReviewAsync = jest.fn();

jest.mock('../../../application/use-spot-reviews', () => ({
  useSpotReviews: (spotId: string, currentUser: unknown) => mockUseSpotReviews(spotId, currentUser),
}));

jest.mock('../../../application/use-update-review', () => ({
  useUpdateReview: () => ({ mutateAsync: mockUpdateReviewAsync }),
}));

jest.mock('../../../application/use-delete-review', () => ({
  useDeleteReview: () => ({ mutateAsync: mockDeleteReviewAsync }),
}));

jest.mock('../../../application/use-report-review', () => ({
  useReportReview: () => ({ mutateAsync: mockReportReviewAsync }),
}));

jest.mock('../report-review-modal', () => ({
  ReportReviewModal: ({
    visible,
    onCancel,
    onSubmit,
    onSubmitted,
  }: {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (input: { reason: string; description: string }) => Promise<unknown>;
    onSubmitted: () => void;
  }) =>
    visible ? (
      <MockView testID="report-review-modal">
        <MockPressable testID="report-review-modal-cancel" onPress={onCancel} />
        <MockPressable
          testID="report-review-modal-submit"
          onPress={async () => {
            await onSubmit({ reason: 'SPAM', description: '' });
            onSubmitted();
          }}
        />
      </MockView>
    ) : null,
}));

jest.mock('@/features/manner', () => ({
  SpotMannerSection: (props: { spotId: string }) => mockSpotMannerSection(props),
}));

jest.mock('@/features/user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  UserAvatar: () => null,
  // サインインへの誘導は visible のときだけ目印を出す（モーダル中身は user 側で検証）。
  SignInModal: ({ visible }: { visible: boolean }) =>
    visible ? <MockView testID="sign-in-modal" /> : null,
}));

jest.mock('@/shared/lib/geo', () => ({
  useCurrentLocation: () => mockUseCurrentLocation(),
}));

jest.mock('@/shared/lib/directions', () => ({
  confirmOpenDirections: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('../review-form', () => ({
  ReviewForm: ({ spotId }: { spotId: string }) => <MockText>{`review-form:${spotId}`}</MockText>,
}));

jest.mock('../review-language-filter', () => ({
  ReviewLanguageFilter: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#60646C',
    background: '#FFFFFF',
    backgroundSelected: '#F0F0F0',
  }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  // 投稿機能そのものの挙動を検証するため、v1 で OFF のフラグを ON にして描画する。
  // OFF のときに何も出さないことは *-user-content-disabled.test.tsx で検証する。
  IS_USER_CONTENT_ENABLED: true,
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
  // 確認ダイアログは表示状態とボタン操作だけ再現する（Alert / Compose の描画は共通ダイアログ側のテストで検証）。
  DestructiveConfirmDialog: ({
    visible,
    title,
    message,
    cancelLabel,
    confirmLabel,
    onConfirm,
    onCancel,
  }: {
    visible: boolean;
    title: string;
    message: string;
    cancelLabel: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    visible ? (
      <MockView testID="destructive-confirm-dialog">
        <MockText>{title}</MockText>
        <MockText>{message}</MockText>
        <MockPressable testID="destructive-confirm-dialog-cancel" onPress={onCancel}>
          <MockText>{cancelLabel}</MockText>
        </MockPressable>
        <MockPressable testID="destructive-confirm-dialog-confirm" onPress={onConfirm}>
          <MockText>{confirmLabel}</MockText>
        </MockPressable>
      </MockView>
    ) : null,
}));

/**
 * 保存は Promise の解決とその後の再レンダーを挟む。CI の遅いランナーでは
 * waitFor の既定（1 秒）で足りずに落ちるため、明示的に長めを渡す。
 */
const ASYNC_TIMEOUT = { timeout: 10_000 };

const OWN_REVIEW = {
  id: 'review-1',
  rating: { value: 3 },
  comment: '編集前のコメント',
  author: { id: 'user-1', name: '荒川蓮', iconUrl: '' },
  postedAt: '2026-09-01T00:00:00.000Z',
  language: 'ja' as const,
};

const OTHERS_REVIEW = {
  id: 'review-2',
  rating: { value: 4 },
  comment: '他人のコメント',
  author: { id: 'user-2', name: '別の人', iconUrl: '' },
  postedAt: '2026-09-02T00:00:00.000Z',
  language: 'ja' as const,
};

/** OTHERS_REVIEW の投稿者とは別の、ログイン中ユーザー。 */
const VIEWER = { id: 'user-1', name: '荒川蓮', iconUrl: '' };

/**
 * レビューカードのメニューは ref の `measureInWindow` で表示位置を測ってから開く。
 * jest-expo の View モックはこのメソッドがコールバックを呼ばないため、
 * 呼ぶように差し替えないとメニューが永久に開かない。
 */
function stubMeasureInWindow() {
  jest
    .spyOn(RNView.prototype, 'measureInWindow')
    .mockImplementation((callback) => callback(0, 0, 0, 0));
}

/** 自分のレビューのメニューから編集モードへ入る。 */
function openEditor() {
  fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));
  fireEvent.press(screen.getByText('tourism.reviewCard.edit'));
}

describe('SpotDetailContent', () => {
  beforeEach(() => {
    mockUpdateReviewAsync.mockReset();
    mockDeleteReviewAsync.mockReset();
    mockReportReviewAsync.mockReset();
    useReportedReviewStore.setState({ reportedReviewIds: {} });
    mockUseSpotReviews.mockReturnValue({ data: [], isPending: false });
    mockUseCurrentUser.mockReturnValue({ name: 'test-user' });
    mockUseCurrentLocation.mockReturnValue({ coords: null });
    // 編集・削除メニューそのものの挙動を検証するため成人として描画する。
    // 18歳未満で出さないことは同 describe 内の専用ケースで検証する。
    useAgeRestrictionStore.setState({ isAdult: true });
  });

  afterEach(() => {
    mockSpotMannerSection.mockClear();
    mockUseSpotReviews.mockReset();
  });

  it('SpotMannerSection に spotId を渡して表示する', () => {
    render(<SpotDetailContent spot={mockSpot} />);

    expect(mockSpotMannerSection).toHaveBeenCalledWith({ spotId: 'nankinmachi' });
    expect(screen.getByText(mockSpot.name)).toBeTruthy();
    expect(screen.getByText('review-form:nankinmachi')).toBeTruthy();
  });

  it('useSpotReviews に現在ユーザーを渡す（#547: 自分のレビュー表示の最新化に使う）', () => {
    render(<SpotDetailContent spot={mockSpot} />);

    expect(mockUseSpotReviews).toHaveBeenCalledWith('nankinmachi', { name: 'test-user' });
  });

  describe('自分のレビューの編集', () => {
    beforeEach(() => {
      stubMeasureInWindow();
      mockUseSpotReviews.mockReturnValue({ data: [OWN_REVIEW], isPending: false });
      mockUseCurrentUser.mockReturnValue(OWN_REVIEW.author);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('保存すると reviewId と変更内容を渡して更新 mutation を呼ぶ', async () => {
      mockUpdateReviewAsync.mockResolvedValue(OWN_REVIEW);
      render(<SpotDetailContent spot={mockSpot} />);

      openEditor();
      fireEvent.changeText(screen.getByDisplayValue('編集前のコメント'), '編集後のコメント');
      fireEvent.press(screen.getByText('tourism.reviewCard.save'));

      await waitFor(
        () =>
          expect(mockUpdateReviewAsync).toHaveBeenCalledWith({
            reviewId: 'review-1',
            changes: { rating: { value: 3 }, comment: '編集後のコメント' },
          }),
        ASYNC_TIMEOUT,
      );
    });

    it('保存に成功したら編集モードを閉じる', async () => {
      mockUpdateReviewAsync.mockResolvedValue(OWN_REVIEW);
      render(<SpotDetailContent spot={mockSpot} />);

      openEditor();
      fireEvent.press(screen.getByText('tourism.reviewCard.save'));

      await waitFor(() => expect(mockUpdateReviewAsync).toHaveBeenCalled(), ASYNC_TIMEOUT);
      await waitFor(
        () => expect(screen.queryByDisplayValue('編集前のコメント')).toBeNull(),
        ASYNC_TIMEOUT,
      );
    });

    it('保存に失敗したらエラーを表示し、編集モードと入力内容を保持する', async () => {
      mockUpdateReviewAsync.mockRejectedValue(new Error('network down'));
      render(<SpotDetailContent spot={mockSpot} />);

      openEditor();
      fireEvent.changeText(screen.getByDisplayValue('編集前のコメント'), '失敗しても消えない');
      fireEvent.press(screen.getByText('tourism.reviewCard.save'));

      await waitFor(
        () => expect(screen.getByText('tourism.reviewCard.saveError')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      expect(screen.getByDisplayValue('失敗しても消えない')).toBeTruthy();
    });

    it('保存中はラベルを切り替え、二重送信を防ぐ', async () => {
      let resolveSave: (review: typeof OWN_REVIEW) => void = () => {};
      mockUpdateReviewAsync.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
      );
      render(<SpotDetailContent spot={mockSpot} />);

      openEditor();
      fireEvent.press(screen.getByText('tourism.reviewCard.save'));

      await waitFor(
        () => expect(screen.getByText('tourism.reviewCard.saving')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      fireEvent.press(screen.getByText('tourism.reviewCard.saving'));
      expect(mockUpdateReviewAsync).toHaveBeenCalledTimes(1);

      await waitFor(() => resolveSave(OWN_REVIEW), ASYNC_TIMEOUT);
    });

    it('18歳未満には自分のレビューでも編集メニューを出さない', () => {
      // 投稿できない以上、編集・削除も提供しない。レビューの閲覧そのものは制限しない。
      useAgeRestrictionStore.setState({ isAdult: false });

      render(<SpotDetailContent spot={mockSpot} />);

      expect(screen.getByText(OWN_REVIEW.comment)).toBeTruthy();
      expect(screen.queryByLabelText('tourism.reviewCard.openMenu')).toBeNull();
    });
  });

  describe('自分のレビューの削除', () => {
    beforeEach(() => {
      stubMeasureInWindow();
      mockUseSpotReviews.mockReturnValue({ data: [OWN_REVIEW], isPending: false });
      mockUseCurrentUser.mockReturnValue(OWN_REVIEW.author);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    /** メニューから「削除」を押して確認ダイアログを開く（メニューを閉じてから少し遅れて表示される）。 */
    async function openDeleteConfirm() {
      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));
      fireEvent.press(screen.getByText('tourism.reviewCard.delete'));

      await waitFor(
        () => expect(screen.getByTestId('destructive-confirm-dialog')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
    }

    function pressDialogButton(button: 'confirm' | 'cancel') {
      fireEvent.press(screen.getByTestId(`destructive-confirm-dialog-${button}`));
    }

    it('削除メニューを押しただけでは確認ダイアログを出すのみで、まだ削除しない', async () => {
      mockDeleteReviewAsync.mockResolvedValue(undefined);
      render(<SpotDetailContent spot={mockSpot} />);

      await openDeleteConfirm();

      expect(mockDeleteReviewAsync).not.toHaveBeenCalled();
    });

    it('確認ダイアログで「削除」を選ぶと reviewId を渡して削除 mutation を呼ぶ', async () => {
      mockDeleteReviewAsync.mockResolvedValue(undefined);
      render(<SpotDetailContent spot={mockSpot} />);

      await openDeleteConfirm();
      pressDialogButton('confirm');

      await waitFor(
        () => expect(mockDeleteReviewAsync).toHaveBeenCalledWith('review-1'),
        ASYNC_TIMEOUT,
      );
    });

    it('確認ダイアログで「キャンセル」を選ぶと削除しない', async () => {
      mockDeleteReviewAsync.mockResolvedValue(undefined);
      render(<SpotDetailContent spot={mockSpot} />);

      await openDeleteConfirm();
      pressDialogButton('cancel');

      expect(screen.queryByTestId('destructive-confirm-dialog')).toBeNull();
      expect(mockDeleteReviewAsync).not.toHaveBeenCalled();
    });

    it('削除中はラベルを表示する', async () => {
      let resolveDelete: () => void = () => {};
      mockDeleteReviewAsync.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
      );
      render(<SpotDetailContent spot={mockSpot} />);

      await openDeleteConfirm();
      pressDialogButton('confirm');

      await waitFor(
        () => expect(screen.getByText('tourism.reviewCard.deleting')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      // 削除中は三点リーダーメニュー自体を出さない（編集に入れてしまわないように）。
      expect(screen.queryByLabelText('tourism.reviewCard.openMenu')).toBeNull();

      await waitFor(() => resolveDelete(), ASYNC_TIMEOUT);
    });

    it('削除に失敗したらエラーを表示し、再試行で削除 mutation を再度呼ぶ', async () => {
      mockDeleteReviewAsync.mockRejectedValueOnce(new Error('network down'));
      render(<SpotDetailContent spot={mockSpot} />);

      await openDeleteConfirm();
      pressDialogButton('confirm');

      await waitFor(
        () => expect(screen.getByText('tourism.reviewCard.deleteError')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );

      mockDeleteReviewAsync.mockResolvedValueOnce(undefined);
      fireEvent.press(screen.getByText('tourism.reviewCard.retry'));

      await waitFor(() => expect(mockDeleteReviewAsync).toHaveBeenCalledTimes(2), ASYNC_TIMEOUT);
    });
  });

  describe('他人のレビュー', () => {
    beforeEach(() => {
      stubMeasureInWindow();
      mockUseSpotReviews.mockReturnValue({ data: [OTHERS_REVIEW], isPending: false });
      mockUseCurrentUser.mockReturnValue(VIEWER);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('他人のレビューのメニューには通報だけを出し、編集・削除は出さない', () => {
      render(<SpotDetailContent spot={mockSpot} />);

      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));

      expect(screen.getByText('tourism.reviewCard.report')).toBeTruthy();
      expect(screen.queryByText('tourism.reviewCard.edit')).toBeNull();
      expect(screen.queryByText('tourism.reviewCard.delete')).toBeNull();
    });

    it('未ログインで通報を押すとサインインを促す', () => {
      mockUseCurrentUser.mockReturnValue(null);
      render(<SpotDetailContent spot={mockSpot} />);

      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));
      fireEvent.press(screen.getByText('tourism.reviewCard.report'));

      expect(screen.getByTestId('sign-in-modal')).toBeTruthy();
      expect(screen.queryByTestId('report-review-modal')).toBeNull();
    });

    it('18歳未満には他人のレビューでも通報メニューを出さない', () => {
      useAgeRestrictionStore.setState({ isAdult: false });

      render(<SpotDetailContent spot={mockSpot} />);

      expect(screen.getByText(OTHERS_REVIEW.comment)).toBeTruthy();
      expect(screen.queryByLabelText('tourism.reviewCard.openMenu')).toBeNull();
    });

    it('author_user_id が無いレビュー（V17 以前の投稿）にも通報メニューを出す', () => {
      const reviewWithoutAuthorId = {
        ...OTHERS_REVIEW,
        author: { ...OTHERS_REVIEW.author, id: '' },
      };
      mockUseSpotReviews.mockReturnValue({ data: [reviewWithoutAuthorId], isPending: false });

      render(<SpotDetailContent spot={mockSpot} />);

      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));

      expect(screen.getByText('tourism.reviewCard.report')).toBeTruthy();
    });

    it('ログイン中に通報を押すと通報モーダルを開く', async () => {
      render(<SpotDetailContent spot={mockSpot} />);

      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));
      fireEvent.press(screen.getByText('tourism.reviewCard.report'));

      await waitFor(
        () => expect(screen.getByTestId('report-review-modal')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      expect(screen.queryByTestId('sign-in-modal')).toBeNull();
    });

    async function submitReport() {
      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));
      fireEvent.press(screen.getByText('tourism.reviewCard.report'));
      await waitFor(
        () => expect(screen.getByTestId('report-review-modal')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      fireEvent.press(screen.getByTestId('report-review-modal-submit'));
    }

    it('送信すると reviewId と理由を渡して通報し、そのレビューを隠して受付表示を出す', async () => {
      mockReportReviewAsync.mockImplementation(async ({ reviewId }: { reviewId: string }) => {
        useReportedReviewStore.getState().markReported(VIEWER.id, reviewId);
        return 'reported';
      });
      render(<SpotDetailContent spot={mockSpot} />);

      await submitReport();

      await waitFor(
        () => expect(screen.getByText('tourism.reportModal.reportedNotice')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      expect(mockReportReviewAsync).toHaveBeenCalledWith({
        reviewId: OTHERS_REVIEW.id,
        reason: 'SPAM',
        description: '',
      });
      expect(screen.queryByText(OTHERS_REVIEW.comment)).toBeNull();
      expect(screen.queryByTestId('report-review-modal')).toBeNull();
    });

    it('レビューがすでに削除されていたら、その旨を表示する', async () => {
      mockReportReviewAsync.mockImplementation(async ({ reviewId }: { reviewId: string }) => {
        useReportedReviewStore.getState().markReported(VIEWER.id, reviewId);
        return 'notFound';
      });
      render(<SpotDetailContent spot={mockSpot} />);

      await submitReport();

      await waitFor(
        () => expect(screen.getByText('tourism.reportModal.notFoundNotice')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      expect(screen.queryByText(OTHERS_REVIEW.comment)).toBeNull();
    });

    it('通報済みのレビューは開き直しても表示しない', () => {
      useReportedReviewStore.setState({ reportedReviewIds: { [VIEWER.id]: [OTHERS_REVIEW.id] } });

      render(<SpotDetailContent spot={mockSpot} />);

      expect(screen.queryByText(OTHERS_REVIEW.comment)).toBeNull();
      expect(screen.getByText('tourism.spotDetail.noReviews')).toBeTruthy();
    });

    it('別のアカウントが通報した記録では隠さない', () => {
      useReportedReviewStore.setState({ reportedReviewIds: { 'other-user': [OTHERS_REVIEW.id] } });

      render(<SpotDetailContent spot={mockSpot} />);

      expect(screen.getByText(OTHERS_REVIEW.comment)).toBeTruthy();
      expect(screen.getByLabelText('tourism.reviewCard.openMenu')).toBeTruthy();
    });

    it('モーダルをキャンセルすると通報しない', async () => {
      render(<SpotDetailContent spot={mockSpot} />);

      fireEvent.press(screen.getByLabelText('tourism.reviewCard.openMenu'));
      fireEvent.press(screen.getByText('tourism.reviewCard.report'));
      await waitFor(
        () => expect(screen.getByTestId('report-review-modal')).toBeTruthy(),
        ASYNC_TIMEOUT,
      );
      fireEvent.press(screen.getByTestId('report-review-modal-cancel'));

      expect(screen.queryByTestId('report-review-modal')).toBeNull();
      expect(mockReportReviewAsync).not.toHaveBeenCalled();
    });
  });
});
