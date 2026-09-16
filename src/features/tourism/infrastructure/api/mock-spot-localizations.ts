import type { SupportedLanguage } from '@/shared/lib/i18n';

export type SpotLocalization = {
  name: string;
  categoryLabel: string;
  description: string;
  address: string;
  businessHours: string;
};

export type MockSpotId =
  | 'kobe-port-tower'
  | 'kitano-ijinkan'
  | 'nankinmachi'
  | 'arima-onsen'
  | 'mount-rokko';

export const MOCK_SPOT_LOCALIZATIONS: Record<
  SupportedLanguage,
  Record<MockSpotId, SpotLocalization>
> = {
  ja: {
    'kobe-port-tower': {
      name: '神戸ポートタワー',
      categoryLabel: 'ウォーターフロント',
      address: '神戸市中央区波止場町5-5',
      description: '神戸港のシンボル。鼓を思わせる赤い鉄塔で、展望フロアから街と海を一望できる。',
      businessHours: '9:00 – 21:00',
    },
    'kitano-ijinkan': {
      name: '北野異人館街',
      categoryLabel: '歴史地区',
      address: '神戸市中央区北野町',
      description:
        '開港期に外国人が暮らした洋館が立ち並ぶ地区。風見鶏の館をはじめ異国情緒あふれる街並みが残る。',
      businessHours: '9:00 – 18:00',
    },
    nankinmachi: {
      name: '南京町',
      categoryLabel: '中華街',
      address: '神戸市中央区栄町通',
      description: '西日本有数の中華街。豚まんや点心など食べ歩きグルメでにぎわう。',
      businessHours: '10:00 – 20:00',
    },
    'arima-onsen': {
      name: '有馬温泉',
      categoryLabel: '温泉',
      address: '神戸市北区有馬町',
      description: '日本三古湯のひとつ。鉄分を含む茶褐色の「金泉」と無色透明の「銀泉」で知られる。',
      businessHours: '24時間',
    },
    'mount-rokko': {
      name: '六甲山',
      categoryLabel: '自然',
      address: '神戸市灘区六甲山町',
      description:
        '神戸の街を見下ろす山。ハイキングや植物園が楽しめ、山上から望む夜景は日本三大夜景に数えられる。',
      businessHours: '9:00 – 17:00',
    },
  },
  en: {
    'kobe-port-tower': {
      name: 'Kobe Port Tower',
      categoryLabel: 'Waterfront',
      address: '5-5 Hatobacho, Chuo Ward, Kobe',
      description:
        'A symbol of Kobe Port. This red lattice tower resembles a drum and offers panoramic views of the city and sea from its observation deck.',
      businessHours: '9:00 AM – 9:00 PM',
    },
    'kitano-ijinkan': {
      name: 'Kitano Ijinkan District',
      categoryLabel: 'Historic District',
      address: 'Kitanocho, Chuo Ward, Kobe',
      description:
        'A neighborhood of Western-style mansions where foreign residents lived after the port opened. Exotic streetscapes remain, including the Weathercock House.',
      businessHours: '9:00 AM – 6:00 PM',
    },
    nankinmachi: {
      name: 'Nankinmachi',
      categoryLabel: 'Chinatown',
      address: 'Sakaemachidori, Chuo Ward, Kobe',
      description:
        'One of the largest Chinatowns in western Japan. Bustling with street food such as pork buns and dim sum.',
      businessHours: '10:00 AM – 8:00 PM',
    },
    'arima-onsen': {
      name: 'Arima Onsen',
      categoryLabel: 'Hot Spring',
      address: 'Arimacho, Kita Ward, Kobe',
      description:
        'One of Japan’s three oldest hot springs. Famous for its iron-rich brown “Kinsen” and clear “Ginsen” waters.',
      businessHours: 'Open 24 hours',
    },
    'mount-rokko': {
      name: 'Mount Rokko',
      categoryLabel: 'Nature',
      address: 'Rokkosancho, Nada Ward, Kobe',
      description:
        'A mountain overlooking Kobe. Enjoy hiking and botanical gardens; the night view from the summit is counted among Japan’s three greatest nightscapes.',
      businessHours: '9:00 AM – 5:00 PM',
    },
  },
  ko: {
    'kobe-port-tower': {
      name: '고베 포트 타워',
      categoryLabel: '워터프런트',
      address: '고베시 주오구 하토바초 5-5',
      description:
        '고베 항의 상징. 북을 연상시키는 붉은 철탑으로, 전망층에서 도시와 바다를 한눈에 볼 수 있다.',
      businessHours: '9:00 – 21:00',
    },
    'kitano-ijinkan': {
      name: '기타노 이진칸 거리',
      categoryLabel: '역사 지구',
      address: '고베시 주오구 기타노초',
      description:
        '개항기 외국인들이 살던 양관이 늘어선 지역. 풍향계관을 비롯해 이국적인 거리 풍경이 남아 있다.',
      businessHours: '9:00 – 18:00',
    },
    nankinmachi: {
      name: '난킨마치',
      categoryLabel: '차이나타운',
      address: '고베시 주오구 사카에마치도리',
      description: '서일본 최대급 차이나타운. 돈만과 딤섬 등 길거리 음식으로 붐비는 곳.',
      businessHours: '10:00 – 20:00',
    },
    'arima-onsen': {
      name: '아리마 온천',
      categoryLabel: '온천',
      address: '고베시 기타구 아리마초',
      description:
        '일본 3대 고온천 중 하나. 철분이 함유된 갈색 「금천」과 무색투명한 「은천」으로 유명하다.',
      businessHours: '24시간',
    },
    'mount-rokko': {
      name: '롯코산',
      categoryLabel: '자연',
      address: '고베시 나다구 롯코산초',
      description:
        '고베 시내를 내려다보는 산. 하이킹과 식물원을 즐길 수 있으며, 정상에서 바라보는 야경은 일본 3대 야경에 꼽힌다.',
      businessHours: '9:00 – 17:00',
    },
  },
  zh: {
    'kobe-port-tower': {
      name: '神户港塔',
      categoryLabel: '海滨',
      address: '神户市中央区波止场町5-5',
      description: '神户港的象征。形如鼓的红色铁塔，从展望层可一览城市与大海。',
      businessHours: '9:00 – 21:00',
    },
    'kitano-ijinkan': {
      name: '北野异人馆街',
      categoryLabel: '历史街区',
      address: '神户市中央区北野町',
      description: '开港时期外国人居住的洋馆林立。风见鸡馆等充满异国情调的街景至今保留。',
      businessHours: '9:00 – 18:00',
    },
    nankinmachi: {
      name: '南京町',
      categoryLabel: '中华街',
      address: '神户市中央区荣町通',
      description: '西日本屈指可数的中华街。肉包、点心等街头美食令这里热闹非凡。',
      businessHours: '10:00 – 20:00',
    },
    'arima-onsen': {
      name: '有马温泉',
      categoryLabel: '温泉',
      address: '神户市北区有马町',
      description: '日本三大古汤之一。以含铁茶褐色的「金泉」与无色透明的「银泉」闻名。',
      businessHours: '24小时',
    },
    'mount-rokko': {
      name: '六甲山',
      categoryLabel: '自然',
      address: '神户市滩区六甲山町',
      description: '俯瞰神户市区的山。可徒步与参观植物园，山顶夜景被誉为日本三大夜景之一。',
      businessHours: '9:00 – 17:00',
    },
  },
};
