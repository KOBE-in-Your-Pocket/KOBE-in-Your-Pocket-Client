import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text as MockText, View as MockView, View as RNView } from 'react-native';

import { SpotDetailContent } from '../spot-detail';

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

jest.mock('../../../application/use-spot-reviews', () => ({
  useSpotReviews: (spotId: string) => mockUseSpotReviews(spotId),
}));

jest.mock('../../../application/use-update-review', () => ({
  useUpdateReview: () => ({ mutateAsync: mockUpdateReviewAsync }),
}));

jest.mock('../../../application/use-delete-review', () => ({
  useDeleteReview: () => jest.fn(),
}));

jest.mock('@/features/manner', () => ({
  SpotMannerSection: (props: { spotId: string }) => mockSpotMannerSection(props),
}));

jest.mock('@/features/user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  UserAvatar: () => null,
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
    mockUseSpotReviews.mockReturnValue({ data: [], isPending: false });
    mockUseCurrentUser.mockReturnValue({ name: 'test-user' });
    mockUseCurrentLocation.mockReturnValue({ coords: null });
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
  });
});
