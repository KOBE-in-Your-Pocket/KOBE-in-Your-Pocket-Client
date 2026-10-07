/** backend の `ReportReason`（docs/report.md）と 1 対 1。 */
export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'HATE',
  'SEXUAL_OR_VIOLENT',
  'PERSONAL_INFO',
  'MISLEADING',
  'OTHER',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** backend の検証と同じ値。 */
export const REPORT_DESCRIPTION_MAX_LENGTH = 500;

export function isReportInputValid(reason: ReportReason | null, description: string): boolean {
  if (reason === null) return false;
  const trimmed = description.trim();
  if (trimmed.length > REPORT_DESCRIPTION_MAX_LENGTH) return false;
  return reason !== 'OTHER' || trimmed !== '';
}
