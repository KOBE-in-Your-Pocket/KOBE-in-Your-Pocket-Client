import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** 避難所一覧をオフライン保存する SQLite テーブル。 */
export const evacuationShelters = sqliteTable('evacuation_shelters', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  type: text('type', { enum: ['emergency', 'designated', 'both'] }).notNull(),
  facilityCategory: text('facility_category', {
    enum: ['government', 'school', 'park', 'gymnasium'],
  }).notNull(),
  imageUrl: text('image_url').notNull(),
  capacity: integer('capacity'),
  accessible: integer('accessible', { mode: 'boolean' }).notNull(),
  externalUrl: text('external_url'),
  phoneNumber: text('phone_number'),
});

/**
 * 避難所テーブルに保存する項目のシード版。
 *
 * 保存済みの行は API から取り直さない限り古い項目のままなので、列を追加するなど
 * 「保存する項目」を増やしたときはこの値を上げる。端末に記録された版と異なる場合、
 * 次回起動時に避難所データを再取得して入れ替える。
 *
 * - 1: `phone_number` を追加（#601）
 */
export const EVACUATION_SHELTERS_SEED_VERSION = 1;

export type EvacuationShelterRecord = typeof evacuationShelters.$inferSelect;
export type NewEvacuationShelterRecord = typeof evacuationShelters.$inferInsert;
