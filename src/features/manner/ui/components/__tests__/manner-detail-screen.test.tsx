import { render, screen } from '@testing-library/react-native';
import { ActivityIndicator, Text as MockText, View as MockView } from 'react-native';

import { MannerDetailScreen } from '../manner-detail-screen';

import type { MannerItem } from '../../../domain/manner-item';
import type { RelatedSpotsState } from '../manner-related-spots';
import type { ReactNode } from 'react';

const mockManner: MannerItem = {
  id: 'no-eating-while-walking',
  title: '食べ歩き禁止',
  description: '指定の飲食スペース以外での食べ歩きはご遠慮ください。',
  icon: 'no-eating-while-walking',
  imageKey: null,
  kind: 'rule',
  scope: 'local',
  relatedSpotIds: ['nankinmachi'],
};

function makeState(overrides: Partial<RelatedSpotsState> = {}): RelatedSpotsState {
  return {
    data: [{ id: 'nankinmachi', name: '南京町' }],
    isPending: false,
    isError: false,
    ...overrides,
  };
}

const mockUseMannerDetail = jest.fn();

jest.mock('../../styles/manner-detail.styles', () => ({
  styles: {
    container: {},
    centered: {},
  },
}));

jest.mock('../../hooks/use-manner-detail', () => ({
  useMannerDetail: (mannerId: string) => mockUseMannerDetail(mannerId),
}));

// MannerDetailContent が受け取った manner と関連スポット状態を text に露出し、伝播を検証できるようにする。
jest.mock('../manner-detail', () => ({
  MannerDetailContent: ({
    manner,
    relatedSpots,
  }: {
    manner: MannerItem;
    relatedSpots: RelatedSpotsState;
  }) => (
    <MockText>
      {`content:${manner.title}:count=${relatedSpots.data ? relatedSpots.data.length : 'undef'}:pending=${relatedSpots.isPending}:error=${relatedSpots.isError}`}
    </MockText>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

describe('MannerDetailScreen', () => {
  beforeEach(() => {
    mockUseMannerDetail.mockReturnValue({ data: mockManner, isPending: false, isError: false });
  });

  afterEach(() => {
    mockUseMannerDetail.mockReset();
  });

  it('useMannerDetail に mannerId を渡す', () => {
    render(<MannerDetailScreen mannerId="no-eating-while-walking" relatedSpots={makeState()} />);

    expect(mockUseMannerDetail).toHaveBeenCalledWith('no-eating-while-walking');
  });

  it('取得中はローディング表示', () => {
    mockUseMannerDetail.mockReturnValue({ data: undefined, isPending: true, isError: false });

    render(<MannerDetailScreen mannerId="no-eating-while-walking" relatedSpots={makeState()} />);

    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByText('manner.detail.loadError')).toBeNull();
    expect(screen.queryByText('manner.detail.notFound')).toBeNull();
  });

  it('取得エラー時は loadError を表示する', () => {
    mockUseMannerDetail.mockReturnValue({ data: undefined, isPending: false, isError: true });

    render(<MannerDetailScreen mannerId="no-eating-while-walking" relatedSpots={makeState()} />);

    expect(screen.getByText('manner.detail.loadError')).toBeTruthy();
  });

  it('マナー未検出時は notFound を表示する', () => {
    mockUseMannerDetail.mockReturnValue({ data: null, isPending: false, isError: false });

    render(<MannerDetailScreen mannerId="unknown" relatedSpots={makeState()} />);

    expect(screen.getByText('manner.detail.notFound')).toBeTruthy();
  });

  it('取得成功時は MannerDetailContent に manner と関連スポット状態を渡す（スポットあり）', () => {
    render(<MannerDetailScreen mannerId="no-eating-while-walking" relatedSpots={makeState()} />);

    expect(screen.getByText('content:食べ歩き禁止:count=1:pending=false:error=false')).toBeTruthy();
  });

  it('関連スポットが空配列でも状態をそのまま伝播する', () => {
    render(
      <MannerDetailScreen
        mannerId="no-eating-while-walking"
        relatedSpots={makeState({ data: [] })}
      />,
    );

    expect(screen.getByText('content:食べ歩き禁止:count=0:pending=false:error=false')).toBeTruthy();
  });

  it('関連スポット取得中の状態も MannerDetailContent へ伝播する', () => {
    render(
      <MannerDetailScreen
        mannerId="no-eating-while-walking"
        relatedSpots={makeState({ data: undefined, isPending: true })}
      />,
    );

    expect(
      screen.getByText('content:食べ歩き禁止:count=undef:pending=true:error=false'),
    ).toBeTruthy();
  });
});
