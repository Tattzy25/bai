import { pgTable, uuid, text, timestamp, varchar, boolean, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table - Neon Auth manages authentication, this table stores user profile data
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Neon Auth user ID from neon_auth.users
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Legacy auth tables (not used - Neon Auth handles all authentication)
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  providerProviderAccountIdIdx: uniqueIndex('provider_provider_account_id_idx').on(table.provider, table.providerAccountId),
}))

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierTokenIdx: uniqueIndex('identifier_token_idx').on(table.identifier, table.token),
}))

// Sites table - one per user site
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 500 }).notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'), // 'free' | 'pro' | 'business'
  publicKey: varchar('public_key', { length: 100 }).notNull().unique(), // used in embed snippet
  allowedReferrers: text('allowed_referrers').array().notNull().default([]), // CORS-style domain validation
  brandingEnabled: boolean('branding_enabled').notNull().default(true), // "Powered by Bridgit-AI"
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending' | 'active' | 'failed'
  lastCrawlAt: timestamp('last_crawl_at'),
  nextCrawlAt: timestamp('next_crawl_at'),
  pagesIndexed: integer('pages_indexed').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sites_user_id_idx').on(table.userId),
  publicKeyIdx: uniqueIndex('sites_public_key_idx').on(table.publicKey),
}))

// Search indexes - stores Upstash credentials per site
export const searchIndexes = pgTable('search_indexes', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }).unique(),
  indexName: varchar('index_name', { length: 255 }).notNull(),
  upstashSearchUrl: text('upstash_search_url').notNull(), // encrypted at rest
  upstashSearchToken: text('upstash_search_token').notNull(), // encrypted at rest
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: uniqueIndex('search_indexes_site_id_idx').on(table.siteId),
}))

// Crawl jobs - track crawl status
export const crawlJobs = pgTable('crawl_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('queued'), // 'queued' | 'running' | 'failed' | 'complete'
  pagesIndexed: integer('pages_indexed').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('crawl_jobs_site_id_idx').on(table.siteId),
  statusIdx: index('crawl_jobs_status_idx').on(table.status),
}))

// Analytics query events - log search queries
export const analyticsQueryEvents = pgTable('analytics_query_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  resultsCount: integer('results_count').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  selectedDocId: varchar('selected_doc_id', { length: 255 }), // if user clicked a result
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('analytics_query_events_site_id_idx').on(table.siteId),
  createdAtIdx: index('analytics_query_events_created_at_idx').on(table.createdAt),
}))

// Quotas - track usage per site
export const quotas = pgTable('quotas', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }).unique(),
  period: varchar('period', { length: 50 }).notNull().default('month'), // 'month'
  queriesUsed: integer('queries_used').notNull().default(0),
  pagesCrawled: integer('pages_crawled').notNull().default(0),
  resetAt: timestamp('reset_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: uniqueIndex('quotas_site_id_idx').on(table.siteId),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sites: many(sites),
  accounts: many(accounts),
  sessions: many(sessions),
}))

export const sitesRelations = relations(sites, ({ one, many }) => ({
  user: one(users, {
    fields: [sites.userId],
    references: [users.id],
  }),
  searchIndex: one(searchIndexes, {
    fields: [sites.id],
    references: [searchIndexes.siteId],
  }),
  crawlJobs: many(crawlJobs),
  analyticsEvents: many(analyticsQueryEvents),
  quota: one(quotas, {
    fields: [sites.id],
    references: [quotas.siteId],
  }),
}))

export const searchIndexesRelations = relations(searchIndexes, ({ one }) => ({
  site: one(sites, {
    fields: [searchIndexes.siteId],
    references: [sites.id],
  }),
}))

export const crawlJobsRelations = relations(crawlJobs, ({ one }) => ({
  site: one(sites, {
    fields: [crawlJobs.siteId],
    references: [sites.id],
  }),
}))

export const analyticsQueryEventsRelations = relations(analyticsQueryEvents, ({ one }) => ({
  site: one(sites, {
    fields: [analyticsQueryEvents.siteId],
    references: [sites.id],
  }),
}))

export const quotasRelations = relations(quotas, ({ one }) => ({
  site: one(sites, {
    fields: [quotas.siteId],
    references: [sites.id],
  }),
}))
