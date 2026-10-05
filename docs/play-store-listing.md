# Play ストア掲載情報の下書き

`docs/android-release.md` §5 の「ストアの掲載情報」に入れる文面。**iOS 側（`apple/README.md`）の
ロケール構成に合わせて 4 言語**用意している。アプリ内の表示名は全言語で `KOBE in Your Pocket`。

> [!NOTE]
> iOS では中国語・韓国語ロケールで Apple が `KOBE in Your Pocket` を「すでに使用されている名前」
> として弾いたため、名前を差し替えている。**Play で同じ制約があるとは限らない**ので、
> まず `KOBE in Your Pocket` で保存してみて、弾かれたら iOS と同じ名前に差し替える。

## アプリ名（30 文字以内）

| ロケール         | 名前                            | 文字数 |
| ---------------- | ------------------------------- | ------ |
| 英語（米国）     | `KOBE in Your Pocket`           | 19     |
| 日本語           | `KOBE in Your Pocket`           | 19     |
| 中国語（簡体字） | `神户口袋 KOBE in Your Pocket`  | 24     |
| 韓国語           | `고베 포켓 KOBE in Your Pocket` | 25     |

## 簡単な説明（80 文字以内）

一覧と検索結果に出る。**ここだけで何のアプリか分かるようにする。**

| ロケール         | 文面                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| 英語（米国）     | `Kobe spots, local manners, and evacuation shelters. Shelters work offline.`             |
| 日本語           | `神戸の観光スポット、地元のマナー、避難所をひとつに。避難所は通信がなくても見られます。` |
| 中国語（簡体字） | `神户的观光景点、当地礼仪与避难场所。避难场所在离线状态下也能查看。`                     |
| 韓国語           | `고베의 관광 명소, 현지 매너, 대피소를 한곳에. 대피소는 오프라인에서도 볼 수 있습니다.`  |

## 詳しい説明（4,000 文字以内）

### 英語（米国）

```
KOBE in Your Pocket is a travel companion for Kobe, Japan, made for visitors from abroad.

WHAT YOU CAN DO

Find sightseeing spots
Browse Kobe's landmarks, nature, history, gourmet and hot spring spots with photos, opening
hours, addresses and reviews from other visitors. See how far each place is from where you
are standing, and open walking directions in your map app with one tap.

Learn local manners
Short, practical notes on how things are done in Japan, and in Kobe specifically. Each
sightseeing spot also shows the manners that matter at that place, so you can check before
you arrive rather than after.

Find evacuation shelters, even without a signal
Japan has earthquakes, typhoons and heavy rain. This app carries the City of Kobe's official
list of designated emergency evacuation sites and shelters, 423 of them, stored on your
device. Once the data is downloaded you can look up the nearest shelter with no network at
all, which is exactly when you are most likely to need it.

For each shelter you can see:
- Which disasters it is designated for (landslide, flood, tsunami, large fire)
- Whether it is indoors or outdoors
- Whether pets are accepted
- Notes from the city, such as "use the west gate" or "evacuate early"

Shelter information is published by the City of Kobe as open data. The source and the date of
the data are shown in the app, so you can tell how current it is.

FOUR LANGUAGES

English, Japanese, Korean and Simplified Chinese. Switch at any time in Settings.

NO ACCOUNT NEEDED

No sign-up, no login, no ads, no payments. Your location stays on your device. It is used to
draw the map and work out distances, and it leaves the device only when you choose to open
walking directions in another app.

Some place names and notes may be machine translated.
```

### 日本語

```
KOBE in Your Pocket は、神戸を訪れる人のための案内アプリです。

できること

観光スポットを探す
神戸のランドマーク・自然・歴史・グルメ・温泉のスポットを、写真や営業時間、住所、
ほかの利用者のレビューと一緒に見られます。今いる場所からの距離が分かり、
ワンタップで地図アプリの徒歩ルートを開けます。

地元のマナーを知る
日本で、そして神戸で、どう振る舞うのが自然かを短くまとめています。観光スポットの
ページにもその場所で特に大事なマナーが出るので、着いてからではなく着く前に確認できます。

通信がなくても避難所を探せる
日本では地震・台風・大雨が起きます。このアプリは神戸市が公開している指定緊急避難場所・
指定避難所 423 件を端末内に保存します。一度取り込めば通信が全くなくても最寄りの避難所を
調べられます。本当に必要になるのは、まさにその状況です。

避難所ごとに次が分かります。
・どの災害に対応しているか（土砂災害・洪水・津波・大火事）
・屋内か屋外か
・ペットの同行が可能か
・「西門を利用」「早めに避難」などの市からの注意書き

避難所の情報は神戸市のオープンデータです。出典とデータの基準日をアプリ内に表示するので、
どの時点の情報かが分かります。

4 言語に対応

日本語・英語・韓国語・中国語（簡体字）。設定からいつでも切り替えられます。

アカウント不要

登録もログインも不要で、広告も課金もありません。現在地は端末内で地図の表示と距離の計算に
使うだけで、外に出るのは徒歩ルートを他のアプリで開くことを選んだときだけです。

施設名や注意書きには機械翻訳が含まれる場合があります。
```

### 中国語（簡体字）

```
KOBE in Your Pocket 是为到访日本神户的旅客准备的导览应用。

主要功能

寻找观光景点
浏览神户的地标、自然、历史、美食与温泉景点，附照片、营业时间、地址以及其他用户的评价。
可以看到各景点距离您当前位置有多远，一键在地图应用中打开步行路线。

了解当地礼仪
以简短实用的方式介绍在日本、特别是在神户的行为方式。每个观光景点的页面也会显示该地点
特别需要注意的礼仪，让您在抵达之前就能确认。

即使没有网络也能查找避难场所
日本会发生地震、台风和暴雨。本应用将神户市公布的指定紧急避难场所与指定避难所共 423 处
保存在您的设备中。数据下载后，即使完全没有网络也能查询最近的避难场所，而那正是最需要
它的时候。

每个避难场所可以查看：
・对应哪些灾害（泥石流、洪水、海啸、大火）
・是室内还是室外
・是否允许携带宠物
・来自市政府的提示，例如「请使用西门」「请尽早避难」

避难场所信息来自神户市的开放数据。应用内会显示数据来源与基准日期，便于您判断信息的时效。

支持四种语言

日语、英语、韩语、简体中文。可随时在设置中切换。

无需账号

无需注册与登录，没有广告与内购。您的位置信息仅在设备内用于显示地图和计算距离，
只有当您选择在其他应用中打开步行路线时才会离开设备。

部分地名与提示文字可能包含机器翻译。
```

### 韓国語

```
KOBE in Your Pocket은 일본 고베를 찾는 분들을 위한 안내 앱입니다.

주요 기능

관광 명소 찾기
고베의 랜드마크, 자연, 역사, 미식, 온천 명소를 사진과 영업시간, 주소, 다른 이용자의
리뷰와 함께 볼 수 있습니다. 현재 위치에서의 거리를 확인하고, 한 번의 탭으로 지도 앱에서
도보 경로를 열 수 있습니다.

현지 매너 알아보기
일본에서, 그리고 고베에서 어떻게 행동하는 것이 자연스러운지를 짧게 정리했습니다.
관광 명소 페이지에도 그 장소에서 특히 중요한 매너가 표시되므로, 도착한 뒤가 아니라
도착하기 전에 확인할 수 있습니다.

네트워크가 없어도 대피소를 찾을 수 있습니다
일본에서는 지진, 태풍, 폭우가 발생합니다. 이 앱은 고베시가 공개한 지정 긴급대피장소 및
지정대피소 423곳을 기기 안에 저장합니다. 한 번 받아두면 네트워크가 전혀 없어도 가까운
대피소를 찾을 수 있습니다. 정말 필요한 때가 바로 그런 상황입니다.

대피소별로 다음을 확인할 수 있습니다.
· 어떤 재해에 대응하는지(토사재해, 홍수, 쓰나미, 대형 화재)
· 실내인지 실외인지
· 반려동물 동반이 가능한지
· "서문을 이용", "일찍 대피" 등 시에서 안내하는 주의사항

대피소 정보는 고베시의 오픈 데이터입니다. 출처와 데이터 기준일을 앱에 표시하므로
어느 시점의 정보인지 알 수 있습니다.

4개 언어 지원

한국어, 일본어, 영어, 중국어(간체). 설정에서 언제든 전환할 수 있습니다.

계정 불필요

가입도 로그인도 필요 없고, 광고와 결제도 없습니다. 위치 정보는 기기 안에서 지도 표시와
거리 계산에만 사용되며, 다른 앱에서 도보 경로를 열기로 선택했을 때만 기기를 벗어납니다.

시설명과 주의사항에는 기계 번역이 포함될 수 있습니다.
```

## そのほかの入力項目

| 項目                 | 値                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| カテゴリ             | 旅行＆地域（iOS のプライマリカテゴリ「旅行」に合わせる）                                               |
| 連絡先メール         | `infomationkobeinyoutpocket@gmail.com`（iOS の App Review 連絡先と同じ。**綴りが意図どおりか要確認**） |
| ウェブサイト         | https://kobe-in-your-pocket.github.io/                                                                 |
| プライバシーポリシー | https://kobe-in-your-pocket.github.io/privacy/                                                         |
| 価格                 | 無料                                                                                                   |

## 画像（未作成のものがある）

| 成果物                   | 要件                                 | 状態                                                               |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------ |
| アプリアイコン           | 512×512 PNG                          | `assets/images/app-icon.png`（1024×1024）から縮小すれば作れる      |
| フィーチャーグラフィック | 1024×500                             | **未作成。Play 固有で iOS には無い**                               |
| スクリーンショット       | 2〜8 枚・**アスペクト比 16:9〜9:16** | **未作成。** iOS 用の 1320×2868（約 1:2.17）は範囲外で流用できない |

## 文面を書くときに守ったこと

- **持っていない機能を書かない。** オフラインで使えるのは避難所だけなので、観光スポットには
  その書き方をしていない（スポットは API から取得する）
- **避難所の件数（423）と出典を明記した。** 防災情報なので、どこの誰がいつ公開したデータかを
  ストアの説明でも示す
- **機械翻訳の可能性に触れた。** 施設名と注意書きは読みから機械的に生成しているため
  （サイト側の注意書きと揃える）
- 「アカウント不要・広告なし・課金なし」を明記した。v1 の実態どおりで、審査でテスト
  アカウントを求められないようにする意図もある
