# Database Schema Guide

## Core Tables

### 1. `users` - User profiles managed by Neon Auth
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,           -- Neon Auth user ID
  email VARCHAR(255) NOT NULL UNIQUE,   -- User email
  emailVerified TIMESTAMP,               -- Email verification date
  name VARCHAR(255),                     -- User display name
  image TEXT,                            -- User avatar
  createdAt TIMESTAMP DEFAULT NOW()      -- Account creation date
)
```

**Purpose:** Stores user profile data. Neon Auth manages all authentication (sign-up, sign-in, JWT).

---

### 2. `sites` - Search sites (one per customer domain)
```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY,                   -- Unique site ID
  userId VARCHAR(255) NOT NULL,          -- Owner user ID (FK to users)
  name VARCHAR(255) NOT NULL,            -- Site name (e.g., "Docs")
  domain VARCHAR(255) NOT NULL,          -- Domain URL (e.g., "docs.example.com")
  publicKey VARCHAR(255) NOT NULL,       -- Public key for embed.js widget
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'active', 'inactive'
  plan VARCHAR(50) DEFAULT 'free',       -- 'free', 'pro', 'business'
  pagesIndexed INTEGER DEFAULT 0,        -- Total pages indexed
  nextCrawlAt TIMESTAMP,                 -- Throttle: next allowed crawl time
  createdAt TIMESTAMP DEFAULT NOW()
)
```

**RLS Policy:** Users can only access their own sites (WHERE user_id = auth.user_id())

---

### 3. `search_indexes` - Upstash Search credentials per site
```sql
CREATE TABLE search_indexes (
  id UUID PRIMARY KEY,
  siteId UUID NOT NULL,                  -- FK to sites
  indexName VARCHAR(255) NOT NULL,       -- Upstash index name
  upstashSearchUrl TEXT NOT NULL,        -- Encrypted Upstash URL
  upstashSearchToken TEXT NOT NULL,      -- Encrypted Upstash token
  createdAt TIMESTAMP DEFAULT NOW()
)
```

**Purpose:** Stores encrypted Upstash credentials per site.

---

### 4. `crawl_jobs` - Background crawler jobs
```sql
CREATE TABLE crawl_jobs (
  id UUID PRIMARY KEY,
  siteId UUID NOT NULL,                  -- FK to sites
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
  startedAt TIMESTAMP,
  completedAt TIMESTAMP,
  pagesCrawled INTEGER DEFAULT 0,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
)
```

**Purpose:** Tracks background crawl jobs for each site.

---

### 5. `quotas` - Rate limits per user/plan
```sql
CREATE TABLE quotas (
  id UUID PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,          -- FK to users
  plan VARCHAR(50),                      -- 'free', 'pro', 'business'
  searchesPerMonth INTEGER,              -- Monthly search limit
  searchesUsedThisMonth INTEGER DEFAULT 0,
  lastResetAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW()
)
```

**Purpose:** Tracks API usage and enforces rate limits.

---

### 6. `analytics_query_events` - Search analytics
```sql
CREATE TABLE analytics_query_events (
  id UUID PRIMARY KEY,
  siteId UUID NOT NULL,                  -- FK to sites
  query VARCHAR(255) NOT NULL,           -- Search query
  resultsCount INTEGER,                  -- Number of results returned
  latencyMs INTEGER,                     -- Query latency in milliseconds
  selectedDocId VARCHAR(255),            -- Which result user clicked (if any)
  createdAt TIMESTAMP DEFAULT NOW()
)
```

**Purpose:** Logs all search queries for analytics and monitoring.

---

## Legacy Tables (Not Used - Keep for Compatibility)

These tables exist for backward compatibility with NextAuth but are **not used** since Neon Auth handles all authentication:

- `accounts` - OAuth provider accounts (NextAuth)
- `sessions` - Session tokens (NextAuth)
- `verificationTokens` - Email verification (NextAuth)

---

## How to Add Test Data

### 1. Using Neon SQL Editor

First, get a test user ID from Neon Auth, then:

```sql
-- Insert test user
INSERT INTO users (id, email, name) VALUES 
  ('user_12345', 'test@example.com', 'Test User');

-- Insert test site
INSERT INTO sites (id, userId, name, domain, publicKey, status) VALUES 
  (gen_random_uuid(), 'user_12345', 'My Docs', 'docs.example.com', 'pk_abc123', 'active');

-- Insert quota
INSERT INTO quotas (id, userId, plan, searchesPerMonth) VALUES 
  (gen_random_uuid(), 'user_12345', 'free', 1000);
```

### 2. Using Drizzle Studio

```bash
pnpm run db:studio
```

Opens a GUI to browse and edit tables.

---

## RLS Policies

All tables with `userId` column have Row-Level Security:

```sql
-- RLS enforces:
WHERE user_id = auth.user_id()
```

This means:
- Users can **only** query their own data
- Database automatically filters results by authenticated user
- No manual user ID checking needed in application code

---

## Key Fields Reference

| Table | Key Field | Purpose |
|-------|-----------|---------|
| users | id | Neon Auth user ID |
| sites | publicKey | Embedded in embed.js widget |
| sites | userId | Owner of the site (RLS) |
| search_indexes | indexName | "site_{publicKey}" |
| quotas | userId | API rate limit tracking |
| analytics_query_events | siteId | Which site was searched |

---

## Example: Create a Complete Site Setup

```sql
-- 1. Insert user (use actual Neon Auth ID)
INSERT INTO users (id, email, name) VALUES 
  ('user_xyz', 'owner@company.com', 'John Owner');

-- 2. Insert site
INSERT INTO sites (id, userId, name, domain, publicKey, status, plan) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'user_xyz', 'API Docs', 'api.company.com', 'pk_prod_123', 'active', 'pro');

-- 3. Insert search index (with encrypted credentials)
INSERT INTO search_indexes (id, siteId, indexName, upstashSearchUrl, upstashSearchToken) VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'site_pk_prod_123', '[encrypted_url]', '[encrypted_token]');

-- 4. Insert quota
INSERT INTO quotas (id, userId, plan, searchesPerMonth) VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', 'user_xyz', 'pro', 10000);

-- 5. Insert initial crawl job
INSERT INTO crawl_jobs (id, siteId, status) VALUES 
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'pending');
```

---

## Environment Setup

To connect to database:

```bash
# Install Drizzle tools
pnpm install drizzle-kit

# Generate migrations from schema changes
pnpm run db:generate

# Push schema to database
pnpm run db:push

# View database in Studio
pnpm run db:studio
```

---

**Last Updated:** December 3, 2025
