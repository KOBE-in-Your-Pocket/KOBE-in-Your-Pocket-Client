import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ActivityIndicator, Text as MockText, View as MockView } from 'react-native';

import { MannerList } from '../manner-list';

import type { MannerItem } from '../../../domain/manner-item';
import type { ReactNode } from 'react';

const mockManners: MannerItem[] = [
  {
    id: 'no-eating-while-walking',
    title: '食べ歩き禁止',
    description: '指定の飲食スペース以外での食べ歩きはご遠慮ください。',
    icon: 'no-eating-while-walking',
    imageKey: null,
    kind: 'rule',
    scope: 'local',
    relatedSpotIds: ['nankinmachi'],
  },
  {
    id: 'show-consideration',
    title: '周囲への配慮',
    description: '周囲の人への配慮を心がけましょう。',
    icon: 'show-consideration',
    imageKey: null,
    kind: 'manner',
    scope: 'local',
    relatedSpotIds: [],
  },
];

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUseFilteredManners = jest.fn();

jest.mock('../../hooks/use-filtered-manners', () => ({
  useFilteredManners: () => mockUseFilteredManners(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../manner-pictogram', () => ({
  MannerPictogram: ({ manner, size }: { manner: MannerItem; size?: number }) => (
    <MockText>{`pictogram:${manner.id}:${size}`}</MockText>
  ),
}));

// バッジは種別が渡っていることだけ確認できれば十分なので、kind を text として露出する軽量モックにする。
jest.mock('../kind-badge', () => ({
  KindBadge: ({ kind }: { kind: string }) => <MockText>{`kind:${kind}`}</MockText>,
}));

// フィルタ本体の挙動は use-kind-filter-store / use-scope-filter-store 側で検証済み。
// ここでは配置確認用のマーカーだけ出す。
jest.mock('../kind-filter', () => ({
  KindFilter: () => <MockText>kind-filter</MockText>,
}));

jest.mock('../scope-filter', () => ({
  ScopeFilter: () => <MockText>scope-filter</MockText>,
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ text: '#000000', textSecondary: '#60646C', backgroundElement: '#F0F0F3' }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  BottomTabInset: 48,
  Fonts: { cursive: 'CursiveFont' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

describe('MannerList', () => {
  afterEach(() => {
    mockUseFilteredManners.mockReset();
    (router.push as jest.Mock).mockReset();
  });

  it('取得中は ActivityIndicator を表示する', () => {
    mockUseFilteredManners.mockReturnValue({ data: undefined, isPending: true, isError: false });

    render(<MannerList />);

    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('取得失敗時はエラーメッセージを表示する', () => {
    mockUseFilteredManners.mockReturnValue({ data: undefined, isPending: false, isError: true });

    render(<MannerList />);

    expect(screen.getByText('manner.list.loadError')).toBeTruthy();
  });

  it('取得成功時はヘッダーと各カードのタイトルを表示する', () => {
    mockUseFilteredManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<MannerList />);

    expect(screen.getByText('manner.list.title')).toBeTruthy();
    expect(screen.getByText(mockManners[0].title)).toBeTruthy();
    expect(screen.getByText(mockManners[1].title)).toBeTruthy();
  });

  it('各カードにピクトグラムを size=72 で表示する', () => {
    mockUseFilteredManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<MannerList />);

    expect(screen.getByText(`pictogram:${mockManners[0].id}:72`)).toBeTruthy();
    expect(screen.getByText(`pictogram:${mockManners[1].id}:72`)).toBeTruthy();
  });

  it('各カードに項目の種別に応じた KindBadge を表示する', () => {
    mockUseFilteredManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<MannerList />);

    expect(screen.getByText('kind:rule')).toBeTruthy();
    expect(screen.getByText('kind:manner')).toBeTruthy();
  });

  it('一覧上部に KindFilter と ScopeFilter を配置する', () => {
    mockUseFilteredManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<MannerList />);

    expect(screen.getByText('kind-filter')).toBeTruthy();
    expect(screen.getByText('scope-filter')).toBeTruthy();
  });

  it('絞り込み結果が 0 件でも KindFilter と ScopeFilter を表示し続ける', () => {
    mockUseFilteredManners.mockReturnValue({ data: [], isPending: false, isError: false });

    render(<MannerList />);

    expect(screen.getByText('manner.list.empty')).toBeTruthy();
    expect(screen.getByText('kind-filter')).toBeTruthy();
    expect(screen.getByText('scope-filter')).toBeTruthy();
  });

  it('カードをタップすると該当マナーの詳細画面へ遷移する', () => {
    mockUseFilteredManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<MannerList />);

    fireEvent.press(screen.getByLabelText(mockManners[0].title));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/manner/[id]',
      params: { id: mockManners[0].id },
    });
  });
});
