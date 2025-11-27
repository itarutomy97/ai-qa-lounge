import { sqliteTable, text, integer, real, customType } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// F32_BLOB カスタム型定義（ベクトル用）
const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

// Episodes table
export const episodes = sqliteTable('episodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  youtubeVideoId: text('youtube_video_id').notNull().unique(),
  newsletterId: text('newsletter_id'),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date'), // ISO 8601 format
  captionFetched: integer('caption_fetched', { mode: 'boolean' }).default(false),
  vectorized: integer('vectorized', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique(), // メールローカルパート
  email: text('email').notNull().unique(),
  apiKeyEncrypted: text('api_key_encrypted'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// User profiles table
export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationType: text('organization_type'), // 自治体、中小製造業など
  jobRole: text('job_role'), // 総務、経営者など
  interestAreas: text('interest_areas'), // JSON string
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Video captions table（ベクトル埋め込み込み）
export const videoCaptions = sqliteTable('video_captions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  episodeId: integer('episode_id').notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  startTime: real('start_time').notNull(), // 秒単位
  duration: real('duration').notNull(),
  text: text('text').notNull(),
  embedding: float32Array('embedding', { dimensions: 1536 }), // OpenAI text-embedding-3-small
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Questions table
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  episodeId: integer('episode_id').notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Answers table
export const answers = sqliteTable('answers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  answerText: text('answer_text').notNull(),
  sources: text('sources'), // JSON string: [{ "caption_id": 123, "start_time": 754, "text": "..." }]
  modelUsed: text('model_used'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Question likes table (Phase 2)
export const questionLikes = sqliteTable('question_likes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  questions: many(questions),
  profiles: many(userProfiles),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, {
    fields: [questions.userId],
    references: [users.id],
  }),
  episode: one(episodes, {
    fields: [questions.episodeId],
    references: [episodes.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

export const episodesRelations = relations(episodes, ({ many }) => ({
  questions: many(questions),
  captions: many(videoCaptions),
}));

export const videoCaptionsRelations = relations(videoCaptions, ({ one }) => ({
  episode: one(episodes, {
    fields: [videoCaptions.episodeId],
    references: [episodes.id],
  }),
}));
