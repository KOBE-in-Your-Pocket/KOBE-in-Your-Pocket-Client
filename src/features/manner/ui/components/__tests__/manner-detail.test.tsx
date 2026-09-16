import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import { MannerDetailContent } from '../manner-detail';

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

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('../manner-pictogram', () => ({
  MannerPictogram: ({ size }: { size?: number }) => <MockText>{`pictogram:${size}`}</MockText>,
}));

jest.mock('../kind-badge', () => ({
  KindBadge: ({ kind }: { kind: string }) => <MockText>{`kind:${kind}`}</MockText>,
}));

// 関連スポットへの状態伝播を検証するため、受け取った props を text に露出する。
jest.mock('../manner-related-spots', () => ({
  MannerRelatedSpots: ({ manner, state }: { manner: MannerItem; state: RelatedSpotsState }) => (
    <MockText>
      {`related:${manner.id}:count=${state.data ? state.data.length : 'undef'}:pending=${state.isPending}:error=${state.isError}`}
    </MockText>
  ),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
}));

describe('MannerDetailContent', () => {
  it('大きなピクトグラム・バッジ・タイトル・詳細を表示する', () => {
    render(<MannerDetailContent manner={mockManner} relatedSpots={makeState()} />);

    expect(screen.getByText('pictogram:140')).toBeTruthy();
    expect(screen.getByText('kind:rule')).toBeTruthy();
    expect(screen.getByText(mockManner.title)).toBeTruthy();
    expect(screen.getByText(mockManner.description)).toBeTruthy();
  });

  it('関連スポットの取得状態をそのまま MannerRelatedSpots へ渡す', () => {
    render(<MannerDetailContent manner={mockManner} relatedSpots={makeState()} />);

    expect(
      screen.getByText('related:no-eating-while-walking:count=1:pending=false:error=false'),
    ).toBeTruthy();
  });

  it('取得中の状態も MannerRelatedSpots へ渡す', () => {
    render(
      <MannerDetailContent
        manner={mockManner}
        relatedSpots={makeState({ data: undefined, isPending: true })}
      />,
    );

    expect(
      screen.getByText('related:no-eating-while-walking:count=undef:pending=true:error=false'),
    ).toBeTruthy();
  });
});
