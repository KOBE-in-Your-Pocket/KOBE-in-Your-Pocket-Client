import { render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { SpotMannerSection } from '../spot-manner-section';

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
    relatedSpotIds: ['nankinmachi'],
  },
];

const mockUseSpotManners = jest.fn();

jest.mock('../../../application/use-spot-manners', () => ({
  useSpotManners: (spotId: string) => mockUseSpotManners(spotId),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../manner-pictogram', () => ({
  MannerPictogram: ({ manner, size }: { manner: MannerItem; size?: number }) => (
    <MockText>{`pictogram:${manner.id}:${size}`}</MockText>
  ),
}));

jest.mock('../kind-badge', () => ({
  KindBadge: ({ kind }: { kind: string }) => <MockText>{`kind:${kind}`}</MockText>,
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ text: '#000000', textSecondary: '#60646C', backgroundElement: '#F0F0F3' }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

describe('SpotMannerSection', () => {
  afterEach(() => {
    mockUseSpotManners.mockReset();
  });

  it('取得中は何も表示しない', () => {
    mockUseSpotManners.mockReturnValue({ data: undefined, isPending: true, isError: false });

    const { toJSON } = render(<SpotMannerSection spotId="nankinmachi" />);

    expect(toJSON()).toBeNull();
  });

  it('取得失敗時は何も表示しない', () => {
    mockUseSpotManners.mockReturnValue({ data: undefined, isPending: false, isError: true });

    const { toJSON } = render(<SpotMannerSection spotId="nankinmachi" />);

    expect(toJSON()).toBeNull();
  });

  it('該当マナーが0件のときは何も表示しない', () => {
    mockUseSpotManners.mockReturnValue({ data: [], isPending: false, isError: false });

    const { toJSON } = render(<SpotMannerSection spotId="unknown-spot" />);

    expect(toJSON()).toBeNull();
  });

  it('該当マナーがあるときはセクションタイトルと各項目を表示する', () => {
    mockUseSpotManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<SpotMannerSection spotId="nankinmachi" />);

    expect(mockUseSpotManners).toHaveBeenCalledWith('nankinmachi');
    expect(screen.getByText('manner.spotSection.title')).toBeTruthy();
    expect(screen.getByText(mockManners[0].title)).toBeTruthy();
    expect(screen.getByText(mockManners[0].description)).toBeTruthy();
    expect(screen.getByText(mockManners[1].title)).toBeTruthy();
    expect(screen.getByText(mockManners[1].description)).toBeTruthy();
  });

  it('各項目に MannerPictogram を size=32 で表示する', () => {
    mockUseSpotManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<SpotMannerSection spotId="nankinmachi" />);

    expect(screen.getByText(`pictogram:${mockManners[0].id}:32`)).toBeTruthy();
    expect(screen.getByText(`pictogram:${mockManners[1].id}:32`)).toBeTruthy();
  });

  it('各項目に種別に応じた KindBadge を表示する', () => {
    mockUseSpotManners.mockReturnValue({ data: mockManners, isPending: false, isError: false });

    render(<SpotMannerSection spotId="nankinmachi" />);

    expect(screen.getByText('kind:rule')).toBeTruthy();
    expect(screen.getByText('kind:manner')).toBeTruthy();
  });
});
