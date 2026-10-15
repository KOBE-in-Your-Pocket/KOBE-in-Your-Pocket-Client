import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import { useListModeStore } from '../../../store/use-list-mode-store';

import { ListGenreFilter } from '../list-genre-filter';

jest.mock('@/features/tourism', () => ({
  GenreFilter: () => <MockText testID="genre-filter">GenreFilter</MockText>,
}));

jest.mock('@/features/evacuation', () => ({
  DisasterFilter: () => <MockText testID="disaster-filter">DisasterFilter</MockText>,
}));

describe('ListGenreFilter', () => {
  beforeEach(() => {
    useListModeStore.setState({ listMode: 'tourism' });
  });

  it('tourism モードのとき GenreFilter を表示する', () => {
    render(<ListGenreFilter />);

    expect(screen.getByTestId('genre-filter')).toBeTruthy();
    expect(screen.queryByTestId('disaster-filter')).toBeNull();
  });

  it('evacuation モードのとき GenreFilter の代わりに DisasterFilter を表示する', () => {
    useListModeStore.setState({ listMode: 'evacuation' });

    render(<ListGenreFilter />);

    expect(screen.queryByTestId('genre-filter')).toBeNull();
    expect(screen.getByTestId('disaster-filter')).toBeTruthy();
  });
});
