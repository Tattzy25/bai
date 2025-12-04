-- ============================================================================
-- BRIDGIT AI - Complete User Setup SQL
-- ============================================================================
-- This SQL file creates one complete, active user with all required data
-- to run the application end-to-end.
--
-- Run this against your Neon Postgres database
-- ============================================================================

-- ============================================================================
-- 1. CREATE USER
-- ============================================================================
-- Replace 'user_avi_kay_001' with actual Neon Auth user ID from your setup
-- This is the unique user ID that Neon Auth will assign
-- Email and name are your real info

INSERT INTO users (id, email, name, image, createdAt)
VALUES (
  'user_avi_kay_001',
  'relayavi@gmail.com',
  'Avi Kay',
  NULL,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE SITE
-- ============================================================================
-- This is the search site configuration
-- publicKey is used in the embed.js widget

INSERT INTO sites (id, userId, name, domain, publicKey, status, plan, pagesIndexed, createdAt)
VALUES (
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6'::uuid,
  'user_avi_kay_001',
  'Tattty',
  'https://tattty.com',
  'pk_tattty_main_001',
  'active',
  'business',
  0,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE SEARCH INDEX
-- ============================================================================
-- Stores encrypted Upstash Search credentials
-- These would normally be encrypted - using placeholders for testing

INSERT INTO search_indexes (id, siteId, indexName, upstashSearchUrl, upstashSearchToken, createdAt)
VALUES (
  'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'::uuid,
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6'::uuid,
  'site_pk_tattty_main_001',
  'https://[placeholder-encrypted-url]',
  '[placeholder-encrypted-token]',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE QUOTA
-- ============================================================================
-- Rate limits for free plan: 1000 searches per month

INSERT INTO quotas (id, userId, plan, searchesPerMonth, searchesUsedThisMonth, lastResetAt, createdAt)
VALUES (
  'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'::uuid,
  'user_avi_kay_001',
  'business',
  999999,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (userId, plan) DO NOTHING;

-- ============================================================================
-- 5. CREATE INITIAL CRAWL JOB
-- ============================================================================
-- First crawl job (status: pending)

INSERT INTO crawl_jobs (id, siteId, status, pagesCrawled, createdAt)
VALUES (
  'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9'::uuid,
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6'::uuid,
  'pending',
  0,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. VERIFY DATA
-- ============================================================================
-- Run these queries to verify everything was inserted correctly

-- Check user exists
-- SELECT * FROM users WHERE id = 'user_avi_kay_001';

-- Check site exists
-- SELECT * FROM sites WHERE userId = 'user_avi_kay_001';

-- Check search index exists
-- SELECT * FROM search_indexes WHERE siteId = 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6'::uuid;

-- Check quota exists
-- SELECT * FROM quotas WHERE userId = 'user_avi_kay_001';

-- Check crawl job exists
-- SELECT * FROM crawl_jobs WHERE siteId = 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6'::uuid;

-- Test RLS (should return the site)
-- SELECT * FROM sites;

-- ============================================================================
-- CONFIGURATION REFERENCE
-- ============================================================================
--
-- User ID:           user_avi_kay_001
-- Email:             relayavi@gmail.com
-- Name:              Avi Kay
-- Site ID:           a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
-- Public Key:        pk_tattty_main_001
-- Site Domain:       https://tattty.com
-- Site Name:         Tattty
-- Plan:              business (unlimited searches)
-- Status:            active
--
-- To use this user in the app:
-- 1. Sign in with email: relayavi@gmail.com
-- 2. Dashboard will show 1 site: "Tattty"
-- 3. Search via embed.js using public key: pk_tattty_main_001
-- 4. Analytics tracked in: analytics_query_events table
--
-- ============================================================================
-- IMPORTANT: After running this SQL
-- ============================================================================
--
-- 1. Update the public key in your embed.js script:
--    <script src="https://tattty.com/embed.js" data-site-key="pk_tattty_main_001"></script>
--
-- 2. Test search endpoint:
--    POST /api/search
--    Body: { "query": "tattty", "siteKey": "pk_tattty_main_001" }
--
-- 3. Verify RLS works by signing in as relayavi@gmail.com
--    Dashboard queries should return only this user's data
--
-- ============================================================================
