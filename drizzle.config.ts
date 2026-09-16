import { defineConfig } from 'drizzle-kit';

// アーキテクチャ（FSD × Clean Architecture）に従い、各 feature の
// infrastructure/db/ 配下にスキーマを置く。drizzle-kit はこの glob で
// 各モジュールのスキーマを収集してマイグレーションを生成する。
// 生成物（./drizzle）は inline-import で JS バンドルへ取り込むためコミットする。
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/features/*/infrastructure/db/schema.ts',
  out: './drizzle',
});
