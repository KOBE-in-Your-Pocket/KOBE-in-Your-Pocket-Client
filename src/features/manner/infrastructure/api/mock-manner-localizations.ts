import type { SupportedLanguage } from '@/shared/lib/i18n';

/** マナー項目の言語依存文言。 */
export type MannerLocalization = {
  title: string;
  description: string;
};

export type MockMannerId =
  | 'no-eating-while-walking'
  | 'put-trash-in-bin'
  | 'no-trespassing'
  | 'handle-products-with-care'
  | 'do-not-obstruct-pedestrians'
  | 'no-smoking-while-walking'
  | 'hold-your-suitcase'
  | 'backpack-on-front'
  | 'show-consideration'
  | 'no-loud-conversation'
  | 'no-phone-calls'
  | 'no-white-clothes-in-kinsen'
  | 'no-feeding-wild-boars';

export const MOCK_MANNER_LOCALIZATIONS: Record<
  SupportedLanguage,
  Record<MockMannerId, MannerLocalization>
> = {
  ja: {
    'no-eating-while-walking': {
      title: '食べ歩き禁止',
      description: '指定の飲食スペース以外での食べ歩きはご遠慮ください。',
    },
    'put-trash-in-bin': {
      title: 'ゴミはゴミ箱へ',
      description: 'ゴミはお持ち帰りいただくか、ゴミ箱へお入れください。',
    },
    'no-trespassing': {
      title: '私有地内への立入禁止',
      description: '私有地や関係者以外立入禁止の区域には入らないでください。',
    },
    'handle-products-with-care': {
      title: '商品は丁寧に扱う',
      description: '店頭の商品は丁寧にお取り扱いください。',
    },
    'do-not-obstruct-pedestrians': {
      title: '他の歩行者の妨げにならない',
      description: '立ち止まる際は道の端に寄り、他の歩行者の通行を妨げないでください。',
    },
    'no-smoking-while-walking': {
      title: '歩きタバコ・路上喫煙禁止',
      description: '路上での喫煙や歩きタバコは禁止です。喫煙は指定の場所でお願いします。',
    },
    'hold-your-suitcase': {
      title: 'スーツケースは手から離さない',
      description: '車内ではスーツケースから手を離さず、しっかり支えてください。',
    },
    'backpack-on-front': {
      title: 'リュックは前に',
      description: '混雑した車内ではリュックを前に抱えてください。',
    },
    'show-consideration': {
      title: '思いやり・譲り合いを大切に',
      description: 'お年寄りや体の不自由な方に席をお譲りください。',
    },
    'no-loud-conversation': {
      title: '大声での会話はお控えください',
      description: '車内では大声での会話をお控えください。',
    },
    'no-phone-calls': {
      title: '通話はご遠慮ください',
      description: '車内での通話はご遠慮ください。携帯電話はマナーモードにご協力ください。',
    },
    'no-white-clothes-in-kinsen': {
      title: '金泉入浴時は色移りに注意',
      description:
        '有馬温泉の金泉は鉄分を多く含み、白い衣類やタオルに色が移ることがあります。入浴時は濃い色の衣類やタオルがおすすめです。',
    },
    'no-feeding-wild-boars': {
      title: 'イノシシへの餌やり禁止',
      description:
        '六甲山周辺は野生のイノシシの生息域です。神戸市条例により餌やりは禁止されています。人への危害を防ぐため近づいたり餌を与えたりしないでください。',
    },
  },
  en: {
    'no-eating-while-walking': {
      title: 'No Eating While Walking',
      description: 'Please refrain from eating while walking outside designated areas.',
    },
    'put-trash-in-bin': {
      title: 'Put Trash in the Bin',
      description: 'Please put your trash in a bin or take it home with you.',
    },
    'no-trespassing': {
      title: 'No Trespassing',
      description: 'Do not enter private property or restricted areas.',
    },
    'handle-products-with-care': {
      title: 'Handle Products With Care',
      description: 'Please handle products on display with care.',
    },
    'do-not-obstruct-pedestrians': {
      title: 'Do Not Block Pedestrians',
      description: 'Step aside when stopping so you do not obstruct other pedestrians.',
    },
    'no-smoking-while-walking': {
      title: 'No Smoking on the Street',
      description:
        'Smoking while walking or on the street is prohibited. Please use designated smoking areas.',
    },
    'hold-your-suitcase': {
      title: 'Keep Hold of Your Suitcase',
      description: 'Keep a firm hold on your suitcase on board so it does not roll away.',
    },
    'backpack-on-front': {
      title: 'Wear Your Backpack in Front',
      description: 'Carry your backpack in front of you in crowded vehicles.',
    },
    'show-consideration': {
      title: 'Show Consideration',
      description: 'Offer your seat to elderly passengers and those in need.',
    },
    'no-loud-conversation': {
      title: 'Refrain From Loud Conversations',
      description: 'Please refrain from loud conversations on board.',
    },
    'no-phone-calls': {
      title: 'No Phone Calls',
      description: 'Please refrain from phone calls on board and set your phone to silent.',
    },
    'no-white-clothes-in-kinsen': {
      title: 'Kinsen Water May Stain Clothing',
      description:
        'Arima Onsen\'s iron-rich kinsen ("gold spring") water can stain white clothing and towels. Bring darker-colored items when bathing.',
    },
    'no-feeding-wild-boars': {
      title: 'No Feeding Wild Boars',
      description:
        'Wild boars live around Mt. Rokko. A Kobe city ordinance prohibits feeding them — do not approach or feed them for your safety.',
    },
  },
  zh: {
    'no-eating-while-walking': {
      title: '禁止边走边吃',
      description: '请勿在指定饮食区以外边走边吃。',
    },
    'put-trash-in-bin': {
      title: '垃圾请丢入垃圾桶',
      description: '请将垃圾丢入垃圾桶或自行带走。',
    },
    'no-trespassing': {
      title: '私人领地严禁擅入',
      description: '请勿进入私人领地或非相关人员禁止进入的区域。',
    },
    'handle-products-with-care': {
      title: '请小心拿取商品',
      description: '请小心拿取店内展示的商品。',
    },
    'do-not-obstruct-pedestrians': {
      title: '请勿妨碍其他行人',
      description: '停留时请靠边，勿妨碍其他行人通行。',
    },
    'no-smoking-while-walking': {
      title: '禁止边走边吸烟',
      description: '禁止在街上或边走边吸烟，请在指定吸烟区吸烟。',
    },
    'hold-your-suitcase': {
      title: '行李箱不离手',
      description: '在车内请勿松开行李箱，务必牢牢扶稳。',
    },
    'backpack-on-front': {
      title: '背包背在身前',
      description: '车内拥挤时请将背包背在身前。',
    },
    'show-consideration': {
      title: '重视体贴与礼让',
      description: '请为老人及行动不便者让座。',
    },
    'no-loud-conversation': {
      title: '请避免大声交谈',
      description: '车内请避免大声交谈。',
    },
    'no-phone-calls': {
      title: '请勿通话',
      description: '车内请勿通话，并将手机调至静音。',
    },
    'no-white-clothes-in-kinsen': {
      title: '金泉泡汤请注意染色',
      description:
        '有马温泉的金泉含铁量高，容易使白色衣物或毛巾染色。泡汤时建议携带深色衣物或毛巾。',
    },
    'no-feeding-wild-boars': {
      title: '禁止投喂野猪',
      description:
        '六甲山一带栖息着野生的日本野猪。根据神户市条例，禁止投喂野猪，请勿靠近或投喂，以确保人身安全。',
    },
  },
  ko: {
    'no-eating-while-walking': {
      title: '보행 중 취식 금지',
      description: '지정된 장소 외에서 걸으며 먹는 것을 삼가 주세요.',
    },
    'put-trash-in-bin': {
      title: '쓰레기는 쓰레기통에',
      description: '쓰레기는 쓰레기통에 넣거나 되가져가 주세요.',
    },
    'no-trespassing': {
      title: '사유지 출입 금지',
      description: '사유지나 관계자 외 출입 금지 구역에는 들어가지 마세요.',
    },
    'handle-products-with-care': {
      title: '상품은 조심히 다루기',
      description: '매장에 진열된 상품은 조심히 다뤄 주세요.',
    },
    'do-not-obstruct-pedestrians': {
      title: '다른 보행자 방해 금지',
      description: '멈출 때는 길 가장자리로 비켜 다른 보행자의 통행을 방해하지 마세요.',
    },
    'no-smoking-while-walking': {
      title: '보행 중·노상 흡연 금지',
      description: '길에서의 흡연이나 걸으며 흡연은 금지입니다. 지정된 장소에서 흡연해 주세요.',
    },
    'hold-your-suitcase': {
      title: '여행가방은 손에서 놓지 않기',
      description: '차내에서는 여행가방에서 손을 떼지 말고 단단히 잡아 주세요.',
    },
    'backpack-on-front': {
      title: '배낭은 앞으로',
      description: '혼잡한 차내에서는 배낭을 앞으로 메 주세요.',
    },
    'show-consideration': {
      title: '배려와 양보를 소중히',
      description: '어르신이나 몸이 불편한 분께 자리를 양보해 주세요.',
    },
    'no-loud-conversation': {
      title: '큰 소리로 대화 삼가기',
      description: '차내에서는 큰 소리로 대화를 삼가 주세요.',
    },
    'no-phone-calls': {
      title: '통화 삼가기',
      description: '차내에서는 통화를 삼가고 휴대전화를 매너모드로 설정해 주세요.',
    },
    'no-white-clothes-in-kinsen': {
      title: '킨센 온천 이용 시 옷 색상 주의',
      description:
        '아리마 온천의 킨센(金泉)은 철분 함량이 높아 흰색 옷이나 수건에 색이 밸 수 있습니다. 입욕 시 짙은 색 옷이나 수건을 준비하는 것이 좋습니다.',
    },
    'no-feeding-wild-boars': {
      title: '멧돼지 먹이 주기 금지',
      description:
        '롯코산 일대에는 야생 멧돼지가 서식합니다. 고베시 조례에 따라 먹이 주기가 금지되어 있으니, 안전을 위해 가까이 가거나 먹이를 주지 마세요.',
    },
  },
};
