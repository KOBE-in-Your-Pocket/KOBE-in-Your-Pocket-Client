import { ApiError } from '../api-error';

describe('ApiError.fromResponse', () => {
  it('統一エラー形式のボディから error/message/violations を引き継ぐ', () => {
    const error = ApiError.fromResponse(400, {
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      violations: [{ field: 'name', message: 'must not be blank' }],
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.error).toBe('Bad Request');
    expect(error.message).toBe('Validation failed');
    expect(error.violations).toEqual([{ field: 'name', message: 'must not be blank' }]);
  });

  it('violations 省略時は空配列で補完する', () => {
    const error = ApiError.fromResponse(404, {
      status: 404,
      error: 'Not Found',
      message: 'Spot not found: spot-1',
    });

    expect(error.violations).toEqual([]);
  });

  it('violations が配列でないボディはフォールバック扱いにする', () => {
    const error = ApiError.fromResponse(400, {
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      violations: 'broken',
    });

    expect(error.error).toBe('UNKNOWN');
    expect(error.violations).toEqual([]);
  });

  it.each([undefined, null, 'plain text', { unexpected: true }])(
    '統一エラー形式でないボディ（%p）はステータスのみで組み立てる',
    (body) => {
      const error = ApiError.fromResponse(500, body);

      expect(error.status).toBe(500);
      expect(error.error).toBe('UNKNOWN');
      expect(error.message).toContain('500');
    },
  );
});
