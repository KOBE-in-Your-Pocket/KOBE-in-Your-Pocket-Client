import { FALLBACK_LANGUAGE, type SupportedLanguage } from '@/shared/lib/i18n';

import type { MannerItem } from '../../domain/manner-item';

import {
  MOCK_MANNER_LOCALIZATIONS,
  type MannerLocalization,
  type MockMannerId,
} from './mock-manner-localizations';

type MockMannerBase = Omit<MannerItem, 'title' | 'description'> & {
  id: MockMannerId;
};

/**
 * mock のマナー項目一覧。
 * 分類（manner / rule）・地域（local / japan）・関連スポットID を混在させている。
 * 言語依存の文言は {@link MOCK_MANNER_LOCALIZATIONS} で管理する。
 * `icon` は対応するベクターアイコン識別キー（UI 側でアイコンにマッピングする想定）。
 * `imageKey` はピクトグラム画像アセットの参照キー。画像未提供の項目は null。
 */
const MOCK_MANNER_BASES: MockMannerBase[] = [
  {
    id: 'no-eating-while-walking',
    icon: 'no-eating-while-walking',
    imageKey: 'no-eating-while-walking',
    kind: 'rule',
    scope: 'local',
    relatedSpotIds: ['nankinmachi'],
  },
  {
    id: 'put-trash-in-bin',
    icon: 'put-trash-in-bin',
    imageKey: 'put-trash-in-bin',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'no-trespassing',
    icon: 'no-trespassing',
    imageKey: 'no-trespassing',
    kind: 'rule',
    scope: 'local',
    relatedSpotIds: ['kitano-ijinkan'],
  },
  {
    id: 'handle-products-with-care',
    icon: 'handle-products-with-care',
    imageKey: 'handle-products-with-care',
    kind: 'manner',
    scope: 'local',
    relatedSpotIds: ['nankinmachi'],
  },
  {
    id: 'do-not-obstruct-pedestrians',
    icon: 'do-not-obstruct-pedestrians',
    imageKey: 'do-not-obstruct-pedestrians',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'no-smoking-while-walking',
    icon: 'no-smoking-while-walking',
    imageKey: 'no-smoking-while-walking',
    kind: 'rule',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'hold-your-suitcase',
    icon: 'hold-your-suitcase',
    imageKey: 'hold-your-suitcase',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'backpack-on-front',
    icon: 'backpack-on-front',
    imageKey: 'backpack-on-front',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'show-consideration',
    icon: 'show-consideration',
    imageKey: 'show-consideration',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'no-loud-conversation',
    icon: 'no-loud-conversation',
    imageKey: 'no-loud-conversation',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'no-phone-calls',
    icon: 'no-phone-calls',
    imageKey: 'no-phone-calls',
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
  {
    id: 'no-white-clothes-in-kinsen',
    icon: 'no-white-clothes-in-kinsen',
    imageKey: null,
    kind: 'manner',
    scope: 'local',
    relatedSpotIds: ['arima-onsen'],
  },
  {
    id: 'no-feeding-wild-boars',
    icon: 'no-feeding-wild-boars',
    imageKey: null,
    kind: 'rule',
    scope: 'local',
    relatedSpotIds: ['mount-rokko'],
  },
];

/** mock fetcher が模すネットワーク遅延（ミリ秒）。 */
const MOCK_LATENCY_MS = 300;

function resolveLocalization(language: SupportedLanguage, id: MockMannerId): MannerLocalization {
  return (
    MOCK_MANNER_LOCALIZATIONS[language]?.[id] ?? MOCK_MANNER_LOCALIZATIONS[FALLBACK_LANGUAGE][id]
  );
}

function buildManner(base: MockMannerBase, language: SupportedLanguage): MannerItem {
  const localized = resolveLocalization(language, base.id);

  return {
    ...base,
    title: localized.title,
    description: localized.description,
    relatedSpotIds: [...base.relatedSpotIds],
  };
}

function cloneManner(manner: MannerItem): MannerItem {
  return {
    ...manner,
    relatedSpotIds: [...manner.relatedSpotIds],
  };
}

/**
 * マナー項目一覧を取得する。
 *
 * 現状は mock データを返すが、実 API 導入後もこの `fetchManners(language): Promise<MannerItem[]>`
 * というシグネチャを維持することで、application / ui 層を変更せずに実装だけを入れ替えられる。
 */
export async function fetchManners(
  language: SupportedLanguage = FALLBACK_LANGUAGE,
): Promise<MannerItem[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  return MOCK_MANNER_BASES.map((base) => cloneManner(buildManner(base, language)));
}

/**
 * 指定 ID のマナー項目を取得する。該当が無ければ null を返す。
 *
 * `fetchManners` と同様、実 API 導入後もこのシグネチャを維持する。
 */
export async function fetchMannerById(
  id: string,
  language: SupportedLanguage = FALLBACK_LANGUAGE,
): Promise<MannerItem | null> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const base = MOCK_MANNER_BASES.find((manner) => manner.id === id);
  if (!base) {
    return null;
  }

  return cloneManner(buildManner(base, language));
}
