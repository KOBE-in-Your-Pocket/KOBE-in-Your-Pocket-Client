import type { ConsentStore } from '../domain/privacy-policy';
import { loadConsent, saveConsent } from '../infrastructure/storage/consent-storage';

/** 本番用の同意記録ストア。 */
export const defaultConsentStore: ConsentStore = {
  loadConsent,
  saveConsent,
};
