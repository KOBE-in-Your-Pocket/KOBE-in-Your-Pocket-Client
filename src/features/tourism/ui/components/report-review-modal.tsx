import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import {
  isReportInputValid,
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_REASONS,
  type ReportReason,
} from '../../domain/report-reason';
import type { ReviewReportInput } from '../../infrastructure/api/review-api';
import { REPORT_ACCENT_COLOR, styles } from '../styles/report-review-modal.styles';

import { ApiError } from '@/shared/lib/api';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

export type ReportReviewModalProps = {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (input: ReviewReportInput) => Promise<unknown>;
  onSubmitted: () => void;
};

export function ReportReviewModal({
  visible,
  onCancel,
  onSubmit,
  onSubmitted,
}: ReportReviewModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const canSubmit = isReportInputValid(reason, description) && !isSubmitting;

  function reset() {
    setReason(null);
    setDescription('');
    setErrorKey(null);
  }

  function handleCancel() {
    if (isSubmitting) return;
    reset();
    onCancel();
  }

  async function handleSubmit() {
    if (!canSubmit || reason === null) return;
    setIsSubmitting(true);
    setErrorKey(null);
    try {
      await onSubmit({ reason, description });
      reset();
      onSubmitted();
    } catch (error) {
      setErrorKey(toErrorKey(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ThemedView type="background" style={styles.card}>
          <ThemedText type="subtitle">{t('tourism.reportModal.title')}</ThemedText>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.options}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('tourism.reportModal.message')}
            </ThemedText>
            <View accessibilityRole="radiogroup">
              {REPORT_REASONS.map((code) => {
                const selected = reason === code;
                return (
                  <Pressable
                    key={code}
                    style={styles.option}
                    onPress={() => setReason(code)}
                    disabled={isSubmitting}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <View
                      style={[
                        styles.radio,
                        { borderColor: selected ? REPORT_ACCENT_COLOR : theme.textSecondary },
                      ]}
                    >
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <ThemedText type="small">{t(`tourism.reportModal.reasons.${code}`)}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={[
                styles.description,
                { backgroundColor: theme.backgroundElement, color: theme.text },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder={t(
                reason === 'OTHER'
                  ? 'tourism.reportModal.descriptionRequired'
                  : 'tourism.reportModal.descriptionOptional',
              )}
              placeholderTextColor={theme.textSecondary}
              maxLength={REPORT_DESCRIPTION_MAX_LENGTH}
              editable={!isSubmitting}
              multiline
              accessibilityLabel={t('tourism.reportModal.descriptionLabel')}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
              {`${description.length}/${REPORT_DESCRIPTION_MAX_LENGTH}`}
            </ThemedText>
          </ScrollView>
          {errorKey && (
            <ThemedText type="small" style={{ color: REPORT_ACCENT_COLOR }}>
              {t(errorKey)}
            </ThemedText>
          )}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, { backgroundColor: theme.backgroundSelected }]}
              onPress={handleCancel}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <ThemedText type="smallBold">{t('tourism.reportModal.cancel')}</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: canSubmit ? REPORT_ACCENT_COLOR : theme.backgroundSelected },
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
            >
              <ThemedText
                type="smallBold"
                style={{ color: canSubmit ? '#FFFFFF' : theme.textSecondary }}
              >
                {t(isSubmitting ? 'tourism.reportModal.submitting' : 'tourism.reportModal.submit')}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** 401 はトークン再発行にも失敗した状態で、待っても直らないため再ログインを促す。 */
function toErrorKey(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'tourism.reportModal.errorUnauthorized';
  }
  return 'tourism.reportModal.error';
}
