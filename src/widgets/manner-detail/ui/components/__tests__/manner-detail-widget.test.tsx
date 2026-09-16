import { render } from '@testing-library/react-native';

import { MannerDetailWidget } from '../manner-detail-widget';

const mockMannerDetailScreen = jest.fn((_props: Record<string, unknown>) => null);
const mockUseSpots = jest.fn();

jest.mock('@/features/manner', () => ({
  MannerDetailScreen: (props: Record<string, unknown>) => mockMannerDetailScreen(props),
}));

jest.mock('@/features/tourism', () => ({
  useSpots: () => mockUseSpots(),
}));

describe('MannerDetailWidget', () => {
  beforeEach(() => {
    mockMannerDetailScreen.mockClear();
    mockUseSpots.mockReset();
  });

  it('mannerId と useSpots の取得状態(relatedSpots)を MannerDetailScreen に渡す', () => {
    mockUseSpots.mockReturnValue({
      data: [{ id: 'nankinmachi', name: '南京町' }],
      isPending: false,
      isError: false,
    });

    render(<MannerDetailWidget mannerId="no-eating-while-walking" />);

    expect(mockMannerDetailScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        mannerId: 'no-eating-while-walking',
        relatedSpots: {
          data: [{ id: 'nankinmachi', name: '南京町' }],
          isPending: false,
          isError: false,
        },
      }),
    );
  });

  it('取得中の状態もそのまま relatedSpots として渡す', () => {
    mockUseSpots.mockReturnValue({ data: undefined, isPending: true, isError: false });

    render(<MannerDetailWidget mannerId="no-eating-while-walking" />);

    expect(mockMannerDetailScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedSpots: { data: undefined, isPending: true, isError: false },
      }),
    );
  });

  it('取得失敗の状態もそのまま relatedSpots として渡す', () => {
    mockUseSpots.mockReturnValue({ data: undefined, isPending: false, isError: true });

    render(<MannerDetailWidget mannerId="no-eating-while-walking" />);

    expect(mockMannerDetailScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedSpots: { data: undefined, isPending: false, isError: true },
      }),
    );
  });
});
