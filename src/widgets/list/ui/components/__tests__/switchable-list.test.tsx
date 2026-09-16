import { render } from '@testing-library/react-native';

import { useListModeStore } from '../../../store/use-list-mode-store';

import { SwitchableList } from '../switchable-list';

const mockSpotList = jest.fn((_props: Record<string, unknown>) => null);
const mockEvacuationList = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('@/features/tourism', () => ({
  SpotList: (props: Record<string, unknown>) => mockSpotList(props),
}));

jest.mock('@/features/evacuation', () => ({
  EvacuationList: (props: Record<string, unknown>) => mockEvacuationList(props),
}));

describe('SwitchableList', () => {
  beforeEach(() => {
    useListModeStore.setState({ listMode: 'tourism' });
    mockSpotList.mockClear();
    mockEvacuationList.mockClear();
  });

  it('tourism モードのとき SpotList を表示し EvacuationList は表示しない', () => {
    render(<SwitchableList />);

    expect(mockSpotList).toHaveBeenCalledTimes(1);
    expect(mockEvacuationList).not.toHaveBeenCalled();
  });

  it('evacuation モードのとき EvacuationList を表示し SpotList は表示しない', () => {
    useListModeStore.setState({ listMode: 'evacuation' });

    render(<SwitchableList />);

    expect(mockEvacuationList).toHaveBeenCalledTimes(1);
    expect(mockSpotList).not.toHaveBeenCalled();
  });

  it('SpotList に showGenreFilter=false・showHeader=false を渡す', () => {
    render(<SwitchableList />);

    expect(mockSpotList).toHaveBeenCalledWith(
      expect.objectContaining({ showGenreFilter: false, showHeader: false }),
    );
  });

  it('EvacuationList に showHeader=false を渡す', () => {
    useListModeStore.setState({ listMode: 'evacuation' });

    render(<SwitchableList />);

    expect(mockEvacuationList).toHaveBeenCalledWith(expect.objectContaining({ showHeader: false }));
  });
});
