import { isReportInputValid, REPORT_DESCRIPTION_MAX_LENGTH } from '../report-reason';

describe('isReportInputValid', () => {
  it('理由が未選択なら送信できない', () => {
    expect(isReportInputValid(null, '説明')).toBe(false);
  });

  it('その他以外は説明が空でも送信できる', () => {
    expect(isReportInputValid('SPAM', '')).toBe(true);
  });

  it('その他は説明が空（空白のみを含む）なら送信できない', () => {
    expect(isReportInputValid('OTHER', '')).toBe(false);
    expect(isReportInputValid('OTHER', '   ')).toBe(false);
    expect(isReportInputValid('OTHER', '別のスポットの話')).toBe(true);
  });

  it('説明が上限を超えたら送信できない', () => {
    expect(isReportInputValid('OTHER', 'あ'.repeat(REPORT_DESCRIPTION_MAX_LENGTH))).toBe(true);
    expect(isReportInputValid('OTHER', 'あ'.repeat(REPORT_DESCRIPTION_MAX_LENGTH + 1))).toBe(false);
  });
});
