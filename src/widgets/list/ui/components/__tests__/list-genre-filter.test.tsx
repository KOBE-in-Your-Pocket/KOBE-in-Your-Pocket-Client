import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import { useListModeStore } from '../../../store/use-list-mode-store';

import { ListGenreFilter } from '../list-genre-filter';

jest.mock('@/features/tourism', () => ({
  GenreFilter: () => <MockText testID="genre-filter">GenreFilter</MockText>,
}));

describe('ListGenreFilter', () => {
  beforeEach(() => {
    useListModeStore.setState({ listMode: 'tourism' });
  });

  it('tourism モードのとき GenreFilter を表示する', () => {
    render(<ListGenreFilter />);

    expect(screen.getByTestId('genre-filter')).toBeTruthy();
  });

  it('evacuation モードのとき GenreFilter を表示しない', () => {
    useListModeStore.setState({ listMode: 'evacuation' });

    render(<ListGenreFilter />);

    expect(screen.queryByTestId('genre-filter')).toBeNull();
  });
});
