import { createApiMannerRepository } from '../api-manner-repository';
import { fetchMannerById, fetchManners } from '../manner-api';

jest.mock('../manner-api', () => ({
  fetchManners: jest.fn(),
  fetchMannerById: jest.fn(),
}));

const fetchMannersMock = fetchManners as jest.Mock;
const fetchMannerByIdMock = fetchMannerById as jest.Mock;

describe('createApiMannerRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll は実 API の一覧取得へ委譲する', async () => {
    fetchMannersMock.mockResolvedValue([]);

    await createApiMannerRepository().findAll('ja');

    expect(fetchMannersMock).toHaveBeenCalledWith('ja');
  });

  it('findById は実 API の単体取得へ委譲する', async () => {
    fetchMannerByIdMock.mockResolvedValue(null);

    await createApiMannerRepository().findById('no-littering', 'en');

    expect(fetchMannerByIdMock).toHaveBeenCalledWith('no-littering', 'en');
  });
});
