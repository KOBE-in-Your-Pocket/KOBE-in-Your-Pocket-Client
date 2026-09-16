/**
 * MannerItem.icon（識別キー）→ ピクトグラム画像アセットのマッピング。
 * 対応する画像が無いキーはこのマップに含まれない（利用側で既存アイコンへのフォールバックを想定）。
 */
export const MANNER_PICTOGRAM_MAP: Record<string, number> = {
  'no-eating-while-walking': require('@/assets/images/manners/no-eating-while-walking.png'),
  'put-trash-in-bin': require('@/assets/images/manners/put-trash-in-bin.png'),
  'no-trespassing': require('@/assets/images/manners/no-trespassing.png'),
  'handle-products-with-care': require('@/assets/images/manners/handle-products-with-care.png'),
  'do-not-obstruct-pedestrians': require('@/assets/images/manners/do-not-obstruct-pedestrians.png'),
  'no-smoking-while-walking': require('@/assets/images/manners/no-smoking-while-walking.png'),
  'hold-your-suitcase': require('@/assets/images/manners/hold-your-suitcase.png'),
  'backpack-on-front': require('@/assets/images/manners/backpack-on-front.png'),
  'show-consideration': require('@/assets/images/manners/show-consideration.png'),
  'no-loud-conversation': require('@/assets/images/manners/no-loud-conversation.png'),
  'no-phone-calls': require('@/assets/images/manners/no-phone-calls.png'),
};
