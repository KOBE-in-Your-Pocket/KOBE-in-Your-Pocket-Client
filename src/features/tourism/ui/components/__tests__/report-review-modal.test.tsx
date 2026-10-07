import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { ApiError } from '@/shared/lib/api';

import { REPORT_DESCRIPTION_MAX_LENGTH } from '../../../domain/report-reason';
import { ReportReviewModal } from '../report-review-modal';

import type { ReactNode } from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#60646C',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
  }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

const ASYNC_TIMEOUT = { timeout: 10_000 };

function renderModal(onSubmit = jest.fn().mockResolvedValue(undefined)) {
  const onCancel = jest.fn();
  const onSubmitted = jest.fn();
  render(
    <ReportReviewModal visible onCancel={onCancel} onSubmit={onSubmit} onSubmitted={onSubmitted} />,
  );
  return { onSubmit, onCancel, onSubmitted };
}

const submitButton = () => screen.getByText('tourism.reportModal.submit');
const descriptionInput = () => screen.getByLabelText('tourism.reportModal.descriptionLabel');

describe('ReportReviewModal', () => {
  it('backend の 7 つの理由を i18n キーで表示する', () => {
    renderModal();

    for (const code of [
      'SPAM',
      'HARASSMENT',
      'HATE',
      'SEXUAL_OR_VIOLENT',
      'PERSONAL_INFO',
      'MISLEADING',
      'OTHER',
    ]) {
      expect(screen.getByText(`tourism.reportModal.reasons.${code}`)).toBeTruthy();
    }
  });

  it('理由を選ぶまで送信できない', () => {
    const { onSubmit } = renderModal();

    fireEvent.press(submitButton());

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('理由を選んで送信すると理由と説明を渡し、成功を通知する', async () => {
    const { onSubmit, onSubmitted } = renderModal();

    fireEvent.press(screen.getByText('tourism.reportModal.reasons.SPAM'));
    fireEvent.press(submitButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled(), ASYNC_TIMEOUT);
    expect(onSubmit).toHaveBeenCalledWith({ reason: 'SPAM', description: '' });
  });

  it('「その他」は説明が空なら送信できず、入力すると送信できる', async () => {
    const { onSubmit } = renderModal();

    fireEvent.press(screen.getByText('tourism.reportModal.reasons.OTHER'));
    fireEvent.press(submitButton());
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(descriptionInput(), '別のスポットの話をしている');
    fireEvent.press(submitButton());

    await waitFor(
      () =>
        expect(onSubmit).toHaveBeenCalledWith({
          reason: 'OTHER',
          description: '別のスポットの話をしている',
        }),
      ASYNC_TIMEOUT,
    );
  });

  it('説明の入力は上限文字数までに制限する', () => {
    renderModal();

    expect(descriptionInput().props.maxLength).toBe(REPORT_DESCRIPTION_MAX_LENGTH);
  });

  it('送信中は二重送信できない', async () => {
    let resolve: () => void = () => {};
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderModal(onSubmit);

    fireEvent.press(screen.getByText('tourism.reportModal.reasons.SPAM'));
    fireEvent.press(submitButton());

    await waitFor(
      () => expect(screen.getByText('tourism.reportModal.submitting')).toBeTruthy(),
      ASYNC_TIMEOUT,
    );
    fireEvent.press(screen.getByText('tourism.reportModal.submitting'));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(submitButton()).toBeTruthy(), ASYNC_TIMEOUT);
  });

  it('失敗したらエラーを表示し、開いたままにする', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('network down'));
    const { onSubmitted } = renderModal(onSubmit);

    fireEvent.press(screen.getByText('tourism.reportModal.reasons.SPAM'));
    fireEvent.press(submitButton());

    await waitFor(
      () => expect(screen.getByText('tourism.reportModal.error')).toBeTruthy(),
      ASYNC_TIMEOUT,
    );
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(submitButton()).toBeTruthy();
  });

  it('ログイン期限切れ（401）なら再ログインを促す', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new ApiError(401, 'Unauthorized', 'expired'));
    renderModal(onSubmit);

    fireEvent.press(screen.getByText('tourism.reportModal.reasons.SPAM'));
    fireEvent.press(submitButton());

    await waitFor(
      () => expect(screen.getByText('tourism.reportModal.errorUnauthorized')).toBeTruthy(),
      ASYNC_TIMEOUT,
    );
    expect(screen.queryByText('tourism.reportModal.error')).toBeNull();
  });

  it('失敗後に再送して成功すれば、エラーを消して成功を通知する', async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(undefined);
    const { onSubmitted } = renderModal(onSubmit);

    fireEvent.press(screen.getByText('tourism.reportModal.reasons.SPAM'));
    fireEvent.press(submitButton());
    await waitFor(
      () => expect(screen.getByText('tourism.reportModal.error')).toBeTruthy(),
      ASYNC_TIMEOUT,
    );

    fireEvent.press(submitButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled(), ASYNC_TIMEOUT);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith({ reason: 'SPAM', description: '' });
  });

  it('キャンセルすると onCancel を呼ぶ', () => {
    const { onCancel, onSubmit } = renderModal();

    fireEvent.press(screen.getByText('tourism.reportModal.cancel'));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
