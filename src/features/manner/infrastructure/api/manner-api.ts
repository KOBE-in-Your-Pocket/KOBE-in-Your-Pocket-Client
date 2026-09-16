import { apiFetch } from '@/shared/lib/api';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { MannerItem, MannerKind, MannerScope } from '../../domain/manner-item';

/**
 * `GET /api/v1/manner/items` のレスポンス要素（backend `MannerItemResponse`）。
 *
 * クライアントの {@link MannerItem} とほぼ同形だが `imageKey` が無い。
 * backend はアイコン識別キー（`icon`）だけを持ち、画像アセットの対応表は
 * クライアント側にあるため（{@link toMannerItem} 参照）。
 */
type MannerItemResponse = {
  id: string;
  title: string;
  description: string;
  icon: string;
  kind: string;
  scope: string;
  relatedSpotIds: string[];
};

/**
 * マナー項目一覧を取得する。
 *
 * バックエンド `GET /api/v1/manner/items` を `lang` クエリ付きで呼び出す。
 * kind / scope / spotId での絞り込みは backend に無く、一覧取得後の
 * クライアント側フィルタで成立する（既存の `useFilteredManners` / `getSpotManners`）。
 */
export async function fetchManners(language: SupportedLanguage): Promise<MannerItem[]> {
  const response = await apiFetch<MannerItemResponse[]>('/api/v1/manner/items', {
    query: { lang: language },
  });

  return response.map(toMannerItem);
}

/**
 * 指定 ID のマナー項目を取得する。該当が無ければ null を返す。
 *
 * backend に単体取得のエンドポイントは無いため（M-1: 一覧取得で足りる前提）、
 * 一覧から絞り込む。項目数が数十件規模のうちは追加のエンドポイントを持つより単純。
 */
export async function fetchMannerById(
  id: string,
  language: SupportedLanguage,
): Promise<MannerItem | null> {
  const manners = await fetchManners(language);

  return manners.find((manner) => manner.id === id) ?? null;
}

/**
 * backend のレスポンスをクライアントの {@link MannerItem} に変換する。
 *
 * `imageKey` は `icon` をそのまま使う。両者は同じ識別キーの空間で（mock でも
 * 全項目 `icon === imageKey`）、対応する画像が無いキーは `MannerPictogram` が
 * アイコン表示へフォールバックする。backend に画像アセットが追加されたときも
 * クライアントの対応表（`MANNER_PICTOGRAM_MAP`）に足すだけで表示に反映される。
 */
function toMannerItem(response: MannerItemResponse): MannerItem {
  return {
    id: response.id,
    title: response.title,
    description: response.description,
    icon: response.icon,
    imageKey: response.icon,
    kind: toMannerKind(response.kind),
    scope: toMannerScope(response.scope),
    relatedSpotIds: response.relatedSpotIds,
  };
}

/**
 * kind / scope は backend 側でも CHECK 制約で閉じた集合に固定されているが、
 * wire 上は素の文字列なので、想定外の値はフィルタが壊れないよう既定値へ寄せる。
 */
function toMannerKind(kind: string): MannerKind {
  return kind === 'rule' ? 'rule' : 'manner';
}

function toMannerScope(scope: string): MannerScope {
  return scope === 'japan' ? 'japan' : 'local';
}
