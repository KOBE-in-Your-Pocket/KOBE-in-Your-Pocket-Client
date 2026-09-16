# ディレクトリ構成ガイド

このドキュメントは、本リポジトリのソースコードを **どこに置くか** を判断するためのガイドです。

> **対象読者**: 初めてこのリポジトリに参加するメンバー全員
> **正式仕様**: [Specification リポジトリ](https://github.com/KOBE-in-Your-Pocket/Specification) の `docs/onboarding/01_architecture-for-beginners.md` および `docs/spec/03_architecture.md`

---

## TL;DR

| 迷ったら                            | 置き場所                  |
| ----------------------------------- | ------------------------- |
| 画面のルーティングだけ              | `src/app/`                |
| 1つの機能（観光・避難など）に閉じる | `src/features/{context}/` |
| 2つ以上の機能を合成する画面         | `src/widgets/`            |
| どの機能にも属さない共通処理        | `src/shared/`             |

**モジュール同士は `index.ts` 経由でのみ import する。** 他モジュールの内部ファイルを直接 import してはいけない。

---

## 1. 設計思想

本プロジェクトは **Modular Monolith × Feature-scoped Clean Architecture** を採用しています。

- **横軸（Modular Monolith）**: 機能ごとにモジュールを分ける
- **縦軸（Clean Architecture）**: 各モジュールの中を層に分け、依存方向を一方通行にする

```
              モジュール内の依存方向
              （Clean Architecture）
                       ▲
                       │  ui ─► application ─► domain ◄─ infrastructure
                       │
   ───────────────────┼───────────────────► モジュール間の境界
                       │  （Modular Monolith）
                       │
              Tourism / Evacuation / Manner ...
```

---

## 2. 全体構成

```
KOBE-in-Your-Poket-Client/
├── src/
│   ├── app/                    # Expo Router（ルーティングのみ・薄いシェル）
│   ├── features/               # 境界づけられたコンテキスト = モジュール
│   ├── widgets/                # 複数モジュールを合成する画面
│   ├── shared/                 # 全モジュール共通の基盤
│   │   ├── ui/                 # 汎用 UI primitive（ThemedText など）
│   │   ├── lib/                # 共通 hooks / ユーティリティ
│   │   │   ├── geo/            # 位置情報（useCurrentLocation など）
│   │   │   ├── theme/          # テーマ / ダークモード
│   │   │   ├── i18n/           # 多言語化
│   │   │   └── storage/        # 永続化
│   │   ├── config/             # テーマトークン・定数
│   │   ├── types/              # グローバル型定義
│   │   └── utils/              # 純粋ユーティリティ
│   ├── global.css              # Tailwind / NativeWind グローバル CSS
│   └── __tests__/              # スモークテストなどスコープ外テスト
├── assets/                     # 画像・フォントなど静的アセット
├── docs/                       # 開発ドキュメント
└── scripts/                    # セットアップ・起動スクリプト
```

> Expo スターター由来の `src/components/` `src/constants/` `src/hooks/` `src/i18n/` `src/types/` は #88 で `src/shared/` 配下へ移行済み。

---

## 3. `src/app/` — ルーティング

Expo Router のファイルベースルーティング用ディレクトリです。

**ここに置くもの**

- 画面のエントリポイント（`_layout.tsx`, `index.tsx` など）
- ルート定義とナビゲーションの組み立て

**ここに置かないもの**

- ビジネスロジック
- API 通信
- ドメインモデル

画面の中身は `src/features/` や `src/widgets/` のコンポーネントを import して組み立てます。

---

## 4. `src/features/` — 機能モジュール

境界づけられたコンテキスト（DDD）ごとに 1 モジュールを置きます。
各モジュールの **公開 API は `index.ts`** です。他モジュールから触れるのはここで export したものだけです。

### 4.1 モジュール一覧

| ディレクトリ          | コンテキスト                   | 区分             | 構成    |
| --------------------- | ------------------------------ | ---------------- | ------- |
| `tourism/`            | 観光（スポット・コース・案内） | コアドメイン     | フル4層 |
| `evacuation/`         | 避難（避難所・緊急避難経路）   | コアドメイン     | フル4層 |
| `manner/`             | マナー（マナー・ルール・啓発） | コアドメイン     | フル4層 |
| `user/`               | ユーザー（ロール・言語設定）   | 支援サブドメイン | 軽量    |
| `content-submission/` | ユーザー投稿（CGM）            | 支援サブドメイン | 軽量    |
| `qr-onboarding/`      | QR 導線（案内所からの起動）    | 支援サブドメイン | 超軽量  |

### 4.2 各モジュールの内部構造（フル4層）

コアドメイン（tourism / evacuation / manner）は次の構造を持ちます。

```
src/features/tourism/
├── domain/                     # ドメインモデル・不変条件・Repository interface
├── application/                # ユースケース（検索する、コースを作る、など）
├── infrastructure/
│   ├── api/                    # REST API クライアント
│   └── db/                     # SQLite（Drizzle）スキーマ
├── ui/
│   ├── components/             # 画面・コンポーネント
│   └── hooks/                  # UI hooks（TanStack Query など）
├── store/                      # Zustand: UI 状態のみ
└── index.ts                    # 公開 API（外部からはここ経由）
```

### 4.3 各層の責務

| 層                 | 何を書く                                            | 依存していい先              |
| ------------------ | --------------------------------------------------- | --------------------------- |
| **domain**         | 型・不変条件・Repository interface。純粋 TypeScript | 何にも依存しない            |
| **application**    | ユースケース（手続きの orchestration）              | domain のみ                 |
| **infrastructure** | API・DB・外部ライブラリのアダプタ                   | domain のみ                 |
| **ui**             | コンポーネント・hooks                               | application, domain, shared |
| **store**          | UI 状態（マップモード、選択中スポットなど）         | domain, application         |

#### 依存方向の鉄則

```
ui ──► application ──► domain ◄── infrastructure
```

- **domain** は React / Expo / Drizzle を import しない
- **infrastructure** は domain の interface を実装する（依存性逆転）
- **ui** は infrastructure を直接呼ばない。application または hook 経由で使う

### 4.4 具体例：「スポットを検索する」の流れ

```
1. [ui]              SearchScreen.tsx でテキスト入力を受ける
2. [ui/hooks]        useSpotSearch(query) を呼ぶ
3. [application]     searchSpots(repo, query) ユースケースを呼ぶ
4. [domain]          SpotRepository.search(query) interface
5. [infrastructure]  SpotApiRepository.search() が REST API を叩く
6. [application]     結果を返す
7. [ui/hooks]        TanStack Query にキャッシュさせて返す
8. [ui]              画面に SpotCard を並べて表示
```

---

## 5. `src/widgets/` — 複数モジュール合成画面

1 つの機能に閉じない、**複数の feature を横断する画面** を置きます。

```
src/widgets/
└── map/                        # 観光⇄避難のマップ切替など
```

例：観光モードと避難モードを切り替えるマップ画面は、`tourism` と `evacuation` の両方の公開 API を `widgets/map/` から合成します。

---

## 6. `src/shared/` — 共通基盤

特定の feature に属さない、横断的なコードを置きます。

```
src/shared/
├── ui/                         # デザインシステム（Button, Text など）
├── lib/
│   ├── geo/                    # GPS・地図・距離計算のラッパ
│   ├── i18n/                   # 多言語化（i18next）のラッパ
│   └── storage/                # AsyncStorage など永続化のラッパ
├── config/                     # 環境変数・定数
├── utils/                      # 汎用ユーティリティ
└── types/                      # 共通型定義
```

| ディレクトリ          | 用途                                   |
| --------------------- | -------------------------------------- |
| `shared/ui/`          | アプリ全体で使う UI コンポーネント     |
| `shared/lib/geo/`     | 位置情報・地図（GeoLocation Context）  |
| `shared/lib/i18n/`    | 翻訳・言語切替（Localization Context） |
| `shared/lib/storage/` | 軽量な設定値の永続化                   |
| `shared/config/`      | env, constants                         |
| `shared/utils/`       | ドメインに無関係な汎用関数             |
| `shared/types/`       | 複数モジュールで共有する型             |

**注意**: `shared/` から `features/` への依存は禁止です（一方通行）。

---

## 7. やってはいけないこと

| NG                                                                      | 理由                                  |
| ----------------------------------------------------------------------- | ------------------------------------- |
| `features/tourism/` から `features/evacuation/` の内部ファイルを import | モジュール境界違反。`index.ts` 経由で |
| `domain/` で `import { View } from 'react-native'`                      | domain は純粋であるべき               |
| `domain/` で `fetch()` を呼ぶ                                           | I/O は infrastructure の責任          |
| `ui` から `infrastructure/api/` を直接 import                           | application または hook を経由する    |
| `shared/` から `features/` を import                                    | 依存方向が逆になる                    |

これらは ESLint（`eslint-plugin-boundaries`）で自動検出する予定です。

---

## 8. 判断フローチャート

```
新しいコードを書く
       │
       ▼
  ルーティングだけ？ ──Yes──► src/app/
       │ No
       ▼
  1つの機能に閉じる？ ──Yes──► src/features/{context}/
       │                      └─ どの層？ → domain / application / infrastructure / ui
       │ No
       ▼
  複数機能を合成？ ──Yes──► src/widgets/
       │ No
       ▼
  汎用の共通処理？ ──Yes──► src/shared/
```

---

## 9. 関連ドキュメント

| ドキュメント                                                     | 内容                                     |
| ---------------------------------------------------------------- | ---------------------------------------- |
| [開発環境セットアップ](./dev-environment.md)                     | Node / pnpm / エミュレータのセットアップ |
| Specification `docs/onboarding/01_architecture-for-beginners.md` | アーキテクチャ入門（概念地図）           |
| Specification `docs/spec/03_architecture.md`                     | アーキテクチャ正式仕様                   |
| Specification `docs/spec/07_bounded-contexts.md`                 | 境界づけられたコンテキスト定義           |

---

## 10. よくある質問

### Q. 新しいファイルはどの層に置けばいい？

「このコードは何にも依存しない純粋なルールか？」→ **domain**
「複数の domain 要素を組み合わせる手順か？」→ **application**
「API や DB など外部との通信か？」→ **infrastructure**
「画面やユーザー操作か？」→ **ui**

### Q. テストはどこに置く？

実装フェーズで詳細を詰めますが、原則として **テスト対象のコードと同じモジュール内** に置きます（例: `domain/` のテストは `features/tourism/domain/` 配下）。

### Q. Expo スターターの `src/components/` はどうする？

**#88 で `src/shared/ui/` に移行済み**。新規の共通 UI コンポーネントは `src/shared/ui/` に置き、`src/shared/ui/index.ts` で公開してください。同様に `src/constants/` → `src/shared/config/`、`src/hooks/` → `src/shared/lib/{geo,theme}/`、`src/i18n/` → `src/shared/lib/i18n/`、`src/types/` → `src/shared/types/` も移行済みです。
