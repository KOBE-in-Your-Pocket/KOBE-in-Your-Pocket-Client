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
});

export type EvacuationShelterRecord = typeof evacuationShelters.$inferSelect;
export type NewEvacuationShelterRecord = typeof evacuationShelters.$inferInsert;
