import { render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { ShelterDatasetNotice } from '../shelter-dataset-notice';

import type { ReactNode } from 'react';

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUseShelterDatasetMetadata = jest.fn();

jest.mock('../../../application/hooks/use-shelter-dataset-metadata', () => ({
  useShelterDatasetMetadata: () => mockUseShelterDatasetMetadata(),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    // 出典行は補間の中身まで見たいので、キーと引数を連結した文字列で確認する。
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

describe('ShelterDatasetNotice', () => {
  it('出典と基準日が保存されていれば表示する', () => {
    mockUseShelterDatasetMetadata.mockReturnValue({
      data: {
        source: '神戸市オープンデータ',
        asOf: '2025-04-02',
        updatedAt: '2025-04-02T00:00:00Z',
      },
    });

    render(<ShelterDatasetNotice />);

    expect(
      screen.getByText(
        'evacuation.dataset.source:{"source":"神戸市オープンデータ","asOf":"2025-04-02"}',
      ),
    ).toBeTruthy();
  });

  it('免責は出典の有無に関わらず常に表示する', () => {
    mockUseShelterDatasetMetadata.mockReturnValue({ data: null });

    render(<ShelterDatasetNotice />);

    expect(screen.getByText('evacuation.dataset.disclaimer')).toBeTruthy();
  });

  it('まだ同期できていないときは出典行を出さない（不明と表示しない）', () => {
    mockUseShelterDatasetMetadata.mockReturnValue({ data: null });

    render(<ShelterDatasetNotice />);

    expect(screen.queryByText(/evacuation\.dataset\.source/)).toBeNull();
  });
});
