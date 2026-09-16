import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText } from 'react-native';

import { MannerRelatedSpots } from '../manner-related-spots';

import type { MannerItem } from '../../../domain/manner-item';
import type { ReactNode } from 'react';

function makeManner(relatedSpotIds: string[]): MannerItem {
  return {
    id: 'no-eating-while-walking',
    title: '食べ歩き禁止',
    description: '説明',
    icon: 'test',
    imageKey: null,
    kind: 'rule',
    scope: 'local',
    relatedSpotIds,
  };
}

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
}));

const WITH_RELATION = makeManner(['nankinmachi']);
const NO_RELATION = makeManner([]);

describe('MannerRelatedSpots', () => {
  afterEach(() => {
    (router.push as jest.Mock).mockReset();
  });

  it('常に「関連スポット」見出しを表示する', () => {
    render(
      <MannerRelatedSpots
        manner={WITH_RELATION}
        state={{ data: [], isPending: false, isError: false }}
      />,
    );

    expect(screen.getByText('manner.detail.relatedSpots')).toBeTruthy();
  });

  it('取得中は読込中の文言を表示する', () => {
    render(
      <MannerRelatedSpots
        manner={WITH_RELATION}
        state={{ data: undefined, isPending: true, isError: false }}
      />,
    );

    expect(screen.getByText('manner.detail.relatedSpotsLoading')).toBeTruthy();
    expect(screen.queryByText('manner.detail.relatedSpotsEmpty')).toBeNull();
    expect(screen.queryByText('manner.detail.relatedSpotsError')).toBeNull();
  });

  it('取得失敗時はエラーの文言を表示する', () => {
    render(
      <MannerRelatedSpots
        manner={WITH_RELATION}
        state={{ data: undefined, isPending: false, isError: true }}
      />,
    );

    expect(screen.getByText('manner.detail.relatedSpotsError')).toBeTruthy();
  });

  it('関連スポットありのときはリンクチップを表示し、タップで観光詳細へ遷移する', () => {
    render(
      <MannerRelatedSpots
        manner={WITH_RELATION}
        state={{
          data: [{ id: 'nankinmachi', name: '南京町' }],
          isPending: false,
          isError: false,
        }}
      />,
    );

    expect(screen.getByText('南京町')).toBeTruthy();
    expect(screen.queryByText('manner.detail.relatedSpotsEmpty')).toBeNull();

    fireEvent.press(screen.getByLabelText('南京町'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/tourism/[id]',
      params: { id: 'nankinmachi' },
    });
  });

  it('手元にリンク可能なデータがあれば、再取得失敗(isError)でもエラーではなくリンクを表示し続ける', () => {
    render(
      <MannerRelatedSpots
        manner={WITH_RELATION}
        state={{ data: [{ id: 'nankinmachi', name: '南京町' }], isPending: false, isError: true }}
      />,
    );

    expect(screen.getByText('南京町')).toBeTruthy();
    expect(screen.queryByText('manner.detail.relatedSpotsError')).toBeNull();
  });

  it('取得成功でも該当スポットが無ければ「なし」を表示する', () => {
    render(
      <MannerRelatedSpots
        manner={WITH_RELATION}
        state={{ data: [{ id: 'other', name: '別のスポット' }], isPending: false, isError: false }}
      />,
    );

    expect(screen.getByText('manner.detail.relatedSpotsEmpty')).toBeTruthy();
    expect(screen.queryByText('別のスポット')).toBeNull();
  });

  it('relatedSpotIds が無い項目は取得中でも待たず「なし」を表示する', () => {
    render(
      <MannerRelatedSpots
        manner={NO_RELATION}
        state={{ data: undefined, isPending: true, isError: false }}
      />,
    );

    expect(screen.getByText('manner.detail.relatedSpotsEmpty')).toBeTruthy();
    expect(screen.queryByText('manner.detail.relatedSpotsLoading')).toBeNull();
  });
});
