import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { MockSpotId } from './mock-spot-localizations';

/** レビューのうち言語に依存する文言（本文・投稿者名）。 */
export type ReviewLocalization = {
  comment: string;
  authorName: string;
};

/**
 * mock レビューの識別子。スポット 1 件につき 2 件のレビューを用意する。
 * 例: `kobe-port-tower-1`。
 */
export type MockReviewId = `${MockSpotId}-${1 | 2}`;

export const MOCK_REVIEW_LOCALIZATIONS: Record<
  SupportedLanguage,
  Record<MockReviewId, ReviewLocalization>
> = {
  ja: {
    'kobe-port-tower-1': {
      comment: '展望フロアからの眺めが最高でした。夜のライトアップも必見です。',
      authorName: '山田 健太',
    },
    'kobe-port-tower-2': {
      comment: 'リニューアル後はより綺麗になっていました。少し混雑していたのが残念。',
      authorName: '佐藤 美咲',
    },
    'kitano-ijinkan-1': {
      comment: '異国情緒あふれる街並みが素敵。坂が多いので歩きやすい靴がおすすめです。',
      authorName: '鈴木 翔',
    },
    'kitano-ijinkan-2': {
      comment: '風見鶏の館は写真映え抜群。神戸の歴史も感じられました。',
      authorName: '高橋 由美',
    },
    'nankinmachi-1': {
      comment: '豚まんが絶品でした！食べ歩きがとにかく楽しい。',
      authorName: '田中 大輔',
    },
    'nankinmachi-2': {
      comment: '週末は人が多すぎて歩くのが大変でした。平日がおすすめ。',
      authorName: '伊藤 彩',
    },
    'arima-onsen-1': {
      comment: '金泉で体の芯まで温まりました。温泉街の雰囲気も最高です。',
      authorName: '渡辺 拓也',
    },
    'arima-onsen-2': {
      comment: '日帰り入浴でも十分楽しめました。アクセスも良いです。',
      authorName: '中村 さくら',
    },
    'mount-rokko-1': {
      comment: '山上から望む夜景は息をのむ美しさでした。',
      authorName: '小林 直樹',
    },
    'mount-rokko-2': {
      comment: 'ハイキングコースが整備されていて気持ちよく歩けました。',
      authorName: '加藤 千夏',
    },
  },
  en: {
    'kobe-port-tower-1': {
      comment:
        'The view from the observation deck was amazing. The night illumination is a must-see.',
      authorName: 'Kenta Yamada',
    },
    'kobe-port-tower-2': {
      comment: 'Even more beautiful after the renovation. A bit crowded, which was a shame.',
      authorName: 'Misaki Sato',
    },
    'kitano-ijinkan-1': {
      comment:
        'Lovely streets full of exotic charm. There are many slopes, so comfortable shoes are recommended.',
      authorName: 'Sho Suzuki',
    },
    'kitano-ijinkan-2': {
      comment: 'The Weathercock House is very photogenic. You can really feel the history of Kobe.',
      authorName: 'Yumi Takahashi',
    },
    'nankinmachi-1': {
      comment: 'The pork buns were excellent! Strolling and eating here is so much fun.',
      authorName: 'Daisuke Tanaka',
    },
    'nankinmachi-2': {
      comment: 'Too crowded on weekends, hard to walk around. I recommend visiting on a weekday.',
      authorName: 'Aya Ito',
    },
    'arima-onsen-1': {
      comment:
        'The Kinsen warmed me to the core. The atmosphere of the hot spring town is wonderful.',
      authorName: 'Takuya Watanabe',
    },
    'arima-onsen-2': {
      comment: 'Even a day trip bath was plenty enjoyable. Easy to get to as well.',
      authorName: 'Sakura Nakamura',
    },
    'mount-rokko-1': {
      comment: 'The night view from the summit was breathtakingly beautiful.',
      authorName: 'Naoki Kobayashi',
    },
    'mount-rokko-2': {
      comment: 'The hiking trails were well maintained and a pleasure to walk.',
      authorName: 'Chinatsu Kato',
    },
  },
  ko: {
    'kobe-port-tower-1': {
      comment: '전망층에서 보는 경치가 최고였어요. 야간 조명도 꼭 봐야 합니다.',
      authorName: '야마다 켄타',
    },
    'kobe-port-tower-2': {
      comment: '리뉴얼 후 더 깨끗해졌어요. 조금 붐볐던 점이 아쉬웠습니다.',
      authorName: '사토 미사키',
    },
    'kitano-ijinkan-1': {
      comment: '이국적인 거리 풍경이 멋져요. 언덕이 많으니 편한 신발을 추천합니다.',
      authorName: '스즈키 쇼',
    },
    'kitano-ijinkan-2': {
      comment: '풍향계관은 사진이 정말 잘 나와요. 고베의 역사도 느낄 수 있었습니다.',
      authorName: '다카하시 유미',
    },
    'nankinmachi-1': {
      comment: '돈만이 일품이었어요! 길거리 음식을 즐기기에 정말 좋습니다.',
      authorName: '다나카 다이스케',
    },
    'nankinmachi-2': {
      comment: '주말에는 사람이 너무 많아 걷기 힘들었어요. 평일을 추천합니다.',
      authorName: '이토 아야',
    },
    'arima-onsen-1': {
      comment: '금천에서 몸속까지 따뜻해졌어요. 온천 거리의 분위기도 최고입니다.',
      authorName: '와타나베 다쿠야',
    },
    'arima-onsen-2': {
      comment: '당일치기 입욕으로도 충분히 즐거웠어요. 접근성도 좋습니다.',
      authorName: '나카무라 사쿠라',
    },
    'mount-rokko-1': {
      comment: '정상에서 바라보는 야경은 숨이 멎을 만큼 아름다웠어요.',
      authorName: '고바야시 나오키',
    },
    'mount-rokko-2': {
      comment: '하이킹 코스가 잘 정비되어 있어 기분 좋게 걸었습니다.',
      authorName: '가토 치나츠',
    },
  },
  zh: {
    'kobe-port-tower-1': {
      comment: '从展望层看到的景色棒极了。夜晚的灯光秀也一定要看。',
      authorName: '山田 健太',
    },
    'kobe-port-tower-2': {
      comment: '翻新之后更加漂亮了。只是有点拥挤，略感遗憾。',
      authorName: '佐藤 美咲',
    },
    'kitano-ijinkan-1': {
      comment: '充满异国情调的街景很美。坡道较多，建议穿舒适的鞋子。',
      authorName: '铃木 翔',
    },
    'kitano-ijinkan-2': {
      comment: '风见鸡馆非常上镜。还能感受到神户的历史。',
      authorName: '高桥 由美',
    },
    'nankinmachi-1': {
      comment: '肉包太好吃了！边走边吃特别有意思。',
      authorName: '田中 大辅',
    },
    'nankinmachi-2': {
      comment: '周末人太多，走路都困难。建议平日前往。',
      authorName: '伊藤 彩',
    },
    'arima-onsen-1': {
      comment: '金泉让身体从里到外都暖和起来。温泉街的氛围也很棒。',
      authorName: '渡边 拓也',
    },
    'arima-onsen-2': {
      comment: '即使是一日游泡汤也很尽兴。交通也很方便。',
      authorName: '中村 樱',
    },
    'mount-rokko-1': {
      comment: '从山顶眺望的夜景美得令人屏息。',
      authorName: '小林 直树',
    },
    'mount-rokko-2': {
      comment: '徒步路线维护得很好，走起来很舒服。',
      authorName: '加藤 千夏',
    },
  },
};
