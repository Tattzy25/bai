# Bridgit-AI Authentication & Database Architecture

## Overview

**Bridgit-AI uses a 3-layer auth stack:**

1. **Stack Auth** — Issues JWTs for Google, GitHub, and email magic links
2. **Neon Authorize** — Validates Stack Auth JWTs and extracts `user_id` for RLS
3. **PostgreSQL RLS** — Enforces row-level security policies at the database level

---

## How It Works (Complete Flow)

### 1. User Sign-Up / Sign-In

- User visits `https://bridgit-ai.com/auth/signin` or `/auth/signup`
- These pages redirect to **Stack Auth hosted pages** (not custom UI)
- Stack Auth handles Google OAuth, GitHub OAuth, and email magic links
- Stack Auth issues a JWT with `sub` (subject = Stack user ID) and signs it with their private key

### 2. JWT Validation at Neon

- App sends JWT in `Authorization: Bearer {jwt}` header with API requests
- Neon Console has Stack Auth configured with JWKS URL:
  ```
  https://api.stack-auth.com/api/v1/projects/17d45220-3912-407a-b77b-51295a88f5d5/.well-known/jwks.json
  ```
- Neon validates JWT signature using Stack's public keys (fetched from JWKS URL)
- On valid JWT, Neon extracts `user_id = jwt.sub` (the Stack user ID)
- Neon makes this available in PostgreSQL as `auth.user_id()` function

### 3. RLS Enforcement

- All protected tables have RLS enabled
- Policies check `auth.user_id()` against `user_id` columns
- Example: `sites` table policy:
  ```sql
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id())
  ```
- Users can only SELECT/INSERT/UPDATE/DELETE rows where they own the record
- **You** (neondb_owner) bypass RLS automatically as a superuser

### 4. API Endpoints

- `/api/sites` — POST to create site (user_id from JWT)
- `/api/search` — GET for search queries (validates referrer + siteKey + RLS)
- `/api/sites/[id]/reindex` — POST to trigger crawl (owned by user via RLS)
- All API routes use JWT from request headers/cookies for auth

---

## Neon Console Setup (What's Already Configured)

✅ **Stack Auth JWKS configured** in Neon Console:
- JWKS URL: `https://api.stack-auth.com/api/v1/projects/17d45220-3912-407a-b77b-51295a88f5d5/.well-known/jwks.json`
- Project ID: `17d45220-3912-407a-b77b-51295a88f5d5`
- `neon_auth` schema created automatically by Neon
- `neon_auth.users_sync` table syncs Stack users to Postgres

⚠️ **RLS NOT YET enabled** on app tables (needs to be done)

---

## Database Schema Structure

### `neon_auth` schema (Managed by Neon, DO NOT ALTER)
```
neon_auth.users_sync  — Automatically synced from Stack Auth
  - id (text, pk)           — Stack user ID
  - email (text)            — User email
  - name (text, nullable)   — User name
```

### `public` schema (Your app tables)
```
public.users
  - id (uuid, pk)           — Local user record (optional, can mirror neon_auth)
  - email (text, unique)    — Email address
  - name (text, nullable)   — Display name
  - createdAt (timestamp)

public.sites (RLS ENABLED)
  - id (uuid, pk)
  - userId (varchar 255)    — Matches Stack Auth user ID (text type!)
  - name, domain, plan, publicKey
  - allowedReferrers (array)
  - status, lastCrawlAt, nextCrawlAt, pagesIndexed
  - createdAt, updatedAt
  
  RLS Policy:
    USING (user_id = auth.user_id())
    WITH CHECK (user_id = auth.user_id())

public.crawl_jobs (RLS ENABLED)
  - id (uuid, pk)
  - siteId (fk → sites.id)
  - status, pagesIndexed, errorMessage
  - startedAt, finishedAt, createdAt
  
  RLS Policy (indirect via sites ownership):
    USING (EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = crawl_jobs.site_id
      AND sites.user_id = auth.user_id()
    ))

public.quotas (RLS ENABLED)
  - id (uuid, pk)
  - siteId (fk → sites.id, unique)
  - period, queriesUsed, pagesCrawled, resetAt

  RLS Policy (indirect via sites):
    USING (EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = quotas.site_id
      AND sites.user_id = auth.user_id()
    ))

public.analytics_query_events (RLS ENABLED)
  - id (uuid, pk)
  - siteId (fk → sites.id)
  - query, resultsCount, latencyMs, selectedDocId
  - createdAt
  
  RLS Policy (indirect via sites):
    USING (EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = analytics_query_events.site_id
      AND sites.user_id = auth.user_id()
    ))

public.search_indexes (No RLS needed, accessed via sites)
  - id (uuid, pk)
  - siteId (fk → sites.id, unique)
  - indexName, upstashSearchUrl (encrypted), upstashSearchToken (encrypted)
```

---

## ⚠️ CRITICAL: DO NOT ALTER Neon Auth Setup

✋ **Never touch:**
- `neon_auth` schema
- `neon_auth.users_sync` table
- Stack Auth configuration in Neon Console
- JWKS URL validation
- `auth.user_id()` function behavior

✋ **Neon automatically manages:**
- JWT validation
- User sync from Stack to `neon_auth.users_sync`
- `auth.user_id()` extraction from JWT

---

## RLS Setup Instructions (To Be Run in Neon Console)

### Step 1: Go to Neon Console SQL Editor

1. Open https://console.neon.tech/app/projects/purple-darkness-08729572
2. Click **SQL Editor** (left sidebar)
3. Paste the SQL from `migrations/enable_rls.sql`
4. Click **Execute**

### Step 2: Run This SQL

```sql
-- Enable RLS on all user-owned tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_query_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for sites table: direct ownership check
CREATE POLICY "sites_authenticated_access" ON public.sites
  FOR ALL TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

-- RLS policy for crawl_jobs: indirect via site ownership
CREATE POLICY "crawl_jobs_authenticated_access" ON public.crawl_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = crawl_jobs.site_id
      AND sites.user_id = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = crawl_jobs.site_id
      AND sites.user_id = auth.user_id()
    )
  );

-- RLS policy for quotas: indirect via site ownership
CREATE POLICY "quotas_authenticated_access" ON public.quotas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = quotas.site_id
      AND sites.user_id = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = quotas.site_id
      AND sites.user_id = auth.user_id()
    )
  );

-- RLS policy for analytics_query_events: indirect via site ownership
CREATE POLICY "analytics_authenticated_access" ON public.analytics_query_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = analytics_query_events.site_id
      AND sites.user_id = auth.user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = analytics_query_events.site_id
      AND sites.user_id = auth.user_id()
    )
  );

-- Grant auth schema access to authenticated role
GRANT USAGE ON SCHEMA auth TO authenticated;
```

### Step 3: Verify RLS is Enabled

Run this to confirm:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('sites', 'crawl_jobs', 'quotas', 'analytics_query_events')
AND schemaname = 'public';
```

Expected output: All 4 tables should have `rowsecurity = true`

---

## Auth Pages Setup

Stack Auth provides **hosted pages** for sign-in/sign-up. Your Next.js app redirects to them:

```typescript
// app/auth/signin/page.tsx
export default function SignInPage() {
  return <StackSignIn />  // Stack's hosted component
}

// app/auth/signup/page.tsx
export default function SignUpPage() {
  return <StackSignUp />  // Stack's hosted component
}
```

✅ These are already configured in `app/providers.tsx` with `<StackProvider>`

---

## API Endpoint Flow (Example: Create Site)

```
1. User submits site form → POST /api/sites
2. Middleware extracts JWT from cookies/headers
3. Neon validates JWT → extracts user_id
4. /api/sites handler calls:
   - stackApp.getUser() → gets user ID from JWT
   - db.insert(sites).values({ userId: user.id, ... })
   - Neon RLS policy checks: user_id = auth.user_id() ✅
5. Site created with correct owner
6. Response sent to client

Next request (GET sites):
1. User makes request with same JWT
2. db.query.sites.findFirst(...)
3. Neon RLS filters: only rows where user_id = auth.user_id()
4. User only sees their sites ✅
```

---

## Troubleshooting

### "Unauthorized" errors on API
- Check JWT is in Authorization header
- Verify Stack Auth JWKS URL is correct in Neon
- Confirm `authenticated` role exists in Neon

### "RLS policy prevents SELECT"
- User ID mismatch: check `sites.user_id` is text type, matches JWT `sub`
- Policy syntax: verify `auth.user_id()` is used (not `current_user()`)
- Test by checking `auth.user_id()` returns a value

### Users see other users' data
- RLS not enabled: run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all 4 tables
- Policy not created: verify policy names and conditions
- Superuser bypass: `neondb_owner` role bypasses RLS (expected)

---

## Summary for Next AI

**DO:**
✅ Use Stack Auth JWT from request → Neon validates → `auth.user_id()` available in SQL
✅ Insert `userId` as Stack's user ID (text, extracted from JWT `sub`)
✅ Rely on RLS policies to filter data per user
✅ Verify RLS is enabled on all 4 tables: sites, crawl_jobs, quotas, analytics_query_events

**DON'T:**
❌ Modify `neon_auth` schema or `users_sync` table
❌ Change Neon Auth configuration or JWKS URL
❌ Use `current_user()` in RLS policies (use `auth.user_id()`)
❌ Manually filter queries by user ID—RLS handles it at DB level
❌ Disable RLS without documenting why
❌ Create custom users table that duplicates `neon_auth.users_sync`

---

## Quick Links

- Neon Console: https://console.neon.tech/app/projects/purple-darkness-08729572
- Stack Auth Project: https://app.stack-auth.com/projects/17d45220-3912-407a-b77b-51295a88f5d5
- Neon RLS Docs: https://neon.com/docs/guides/neon-rls
- Neon + Stack Auth Tutorial: https://neon.com/docs/guides/neon-authorize-tutorial

---

**Last Updated:** December 3, 2025
**Author:** AI Assistant
**Version:** 1.0
