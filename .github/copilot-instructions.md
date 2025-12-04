# Bridgit-AI Copilot Instructions

## Project Overview

Bridgit-AI is a Next.js 15 multi-tenant SaaS for adding fast, typo-tolerant search to static sites via Upstash Search. Goal: "From URL to live search in < 2 minutes."

**Core Architecture**: 3-layer auth + encrypted multi-tenant search
1. **Stack Auth** → JWT-based auth (Google, GitHub, email magic links)
2. **Neon Authorize** → JWT validation + RLS enforcement at database level
3. **Upstash Search** → Per-site encrypted search credentials, referrer-validated Edge API

**Critical Security Model**: Never expose Upstash credentials client-side. All search queries flow through `/api/search` (Edge) which validates referrers, decrypts credentials, and maps public `siteKey` to internal tokens.

## Stack & Build System

- **Framework**: Next.js 15.5.7 (App Router, React 19, TypeScript 5, Turbopack)
- **Database**: Neon Postgres + Drizzle ORM (schema: `lib/db/schema.ts`)
- **Auth**: Stack Auth (`@stackframe/stack`) with Neon RLS integration
- **Search**: Upstash Search + Crawler (`@upstash/search`, `@upstash/search-crawler`)
- **UI**: TailwindCSS 4, shadcn/ui "new-york", `lucide-react` icons
- **Deployment**: Vercel (Edge runtime for `/api/search`)

### Dev Commands
```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # ESLint 9 flat config
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Apply migrations to Neon
pnpm db:studio        # Open Drizzle Studio
```

## Authentication Architecture (CRITICAL)

### Stack Auth + Neon RLS Flow

1. **User signs in** → Stack Auth issues JWT (hosted pages at `/auth/signin`, `/auth/signup`)
2. **JWT sent to API** → Neon validates JWT signature via JWKS URL (configured in Neon Console)
3. **RLS enforcement** → Neon extracts `user_id` from JWT `sub` claim, available as `auth.user_id()` in Postgres
4. **Row-level policies** → All user data tables check `user_id = auth.user_id()` in RLS policies

**Key Files**:
- `lib/stack.ts` - Stack Auth server instance (`tokenStore: "nextjs-cookie"`)
- `app/providers.tsx` - Client-side `<StackProvider>` wrapper (requires `NEXT_PUBLIC_STACK_PROJECT_ID` + `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`)
- `middleware.ts` - Protects `/app/*` routes, redirects unauthenticated users to `/auth/signin`
- `NEON_STACK_AUTH_GUIDE.md` - Full auth architecture documentation

### Getting Current User

**Server Components/API Routes**:
```typescript
import { stackApp } from "@/lib/stack"
const user = await stackApp.getUser() // Returns { id, email, ... } or null
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Client Components**:
```tsx
"use client"
import { useUser } from "@stackframe/stack"
const user = useUser() // null if not authenticated
```

### RLS Policy Pattern

All user-owned tables use this pattern (see `lib/db/schema.ts` + `scripts/setup-rls.ts`):
```sql
-- Direct ownership (e.g., sites table)
CREATE POLICY "sites_authenticated_access" ON public.sites
  FOR ALL TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

-- Indirect ownership (e.g., crawl_jobs via sites)
CREATE POLICY "crawl_jobs_authenticated_access" ON public.crawl_jobs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = crawl_jobs.site_id AND sites.user_id = auth.user_id()));
```

**⚠️ NEVER modify `neon_auth` schema** - it's managed by Neon for JWT sync.

## Database Schema & Relationships

### Core Tables (all use UUID primary keys except `users`)

**`users`** - Stack Auth user records
- `id: varchar(255)` (Stack user ID, e.g., `'3d62940c-006e-...'`)
- `email`, `name`, `image`, `createdAt`

**`sites`** - User-created search sites (RLS: `user_id = auth.user_id()`)
- `userId` → references `users.id`
- `publicKey` - unique key for embed snippet (format: `bai_<32-hex-chars>`)
- `allowedReferrers` - text array for CORS-style validation
- `plan` - `'free' | 'pro' | 'business'` (affects rate limits, crawl throttle)
- `status` - `'pending' | 'active' | 'failed'`
- `nextCrawlAt` - crawl throttle timestamp (plan-based: 30min free, 10min pro, 2min business)

**`search_indexes`** - Encrypted Upstash credentials per site (1:1 with sites)
- `siteId` → references `sites.id` (unique)
- `upstashSearchUrl`, `upstashSearchToken` - **encrypted with AES-256-GCM** (see `lib/crypto.server.ts`)

**`crawl_jobs`** - Async crawl tracking (RLS: indirect via sites)
- `siteId` → references `sites.id`
- `status` - `'queued' | 'running' | 'failed' | 'complete'`
- `pagesIndexed`, `errorMessage`, `startedAt`, `finishedAt`

**`quotas`** - Monthly usage limits (RLS: indirect via sites)
- `siteId` → references `sites.id` (unique)
- `queriesUsed`, `pagesCrawled`, `resetAt`
- Plan limits: free=1K, pro=10K, business=100K queries/month

**`analytics_query_events`** - Search analytics (RLS: indirect via sites)
- `siteId`, `query`, `resultsCount`, `latencyMs`, `selectedDocId`, `createdAt`

### Drizzle Queries with Relations

```typescript
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Fetch site with all related data
const site = await db.query.sites.findFirst({
  where: eq(sites.publicKey, siteKey),
  with: {
    searchIndex: true,  // 1:1 relation
    quota: true,        // 1:1 relation
    crawlJobs: true,    // 1:many relation
  },
})
```

## API Endpoint Patterns

### `POST /api/sites` - Create Site + Provision Search

1. Authenticate user via `stackApp.getUser()`
2. Generate unique `publicKey` via `generatePublicKey()` (from `lib/crypto.server.ts`)
3. Create `sites` record with `userId = user.id` (RLS auto-enforces ownership)
4. Encrypt Upstash credentials and store in `search_indexes`
5. Initialize `quotas` record (reset monthly)
6. Enqueue `crawl_jobs` record (status: `'queued'`)

**Key Pattern**: All writes use `userId: user.id` - RLS ensures users can't write to others' data.

### `GET /api/search` - Edge Runtime Search Proxy

1. Extract `siteKey` + `q` (query) from URL params
2. Validate referrer against `sites.allowedReferrers` (prevents hotlinking)
3. Check `quotas.queriesUsed` vs plan limits
4. Rate limit: count recent `analytics_query_events` (60 QPM free, 600 pro, 6000 business)
5. Decrypt `search_indexes` credentials via `decrypt()` (from `lib/crypto.edge.ts`)
6. Query Upstash Search, log analytics event, increment quota

**Runtime**: Must use Edge (`export const runtime = 'edge'`) for global low latency.

### `POST /api/crawl` - Background Crawl Executor

1. Fetch site + search index from DB
2. Check `nextCrawlAt` throttle (plan-based cooldown)
3. Update `crawl_jobs` status to `'running'`
4. Call `crawlAndIndex()` from `@upstash/search-crawler`
5. Update `sites.pagesIndexed`, `sites.lastCrawlAt`, `sites.nextCrawlAt`
6. Mark `crawl_jobs` as `'complete'` or `'failed'`

**Throttle Logic**: After crawl, set `nextCrawlAt = now + throttleMinutes * 60 * 1000` (30/10/2 min for free/pro/business).

## Encryption Patterns

**Server-side** (`lib/crypto.server.ts` - Node.js `crypto`):
```typescript
import { encrypt, decrypt, generatePublicKey } from '@/lib/crypto.server'
const encrypted = encrypt('sensitive-value')  // Returns 'iv:authTag:ciphertext'
const decrypted = decrypt(encrypted)          // Returns original value
const pubKey = generatePublicKey()            // Returns 'bai_<32-hex-chars>'
```

**Edge runtime** (`lib/crypto.edge.ts` - Web Crypto API):
```typescript
import { decrypt } from '@/lib/crypto.edge'
const decrypted = await decrypt(encrypted)    // Async for Web Crypto
```

**Environment**: Requires `ENCRYPTION_KEY` (32-char base64 string) - defaults to dev key if missing.

## Component & UI Patterns

### Import Paths (tsconfig aliases)
```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { db } from "@/lib/db"
import { stackApp } from "@/lib/stack"
```

### shadcn/ui Conventions

**Adding components**:
```bash
npx shadcn@latest add [component-name]  # Uses "new-york" style, neutral base
```

**Always use `cn()` for className merging**:
```tsx
import { cn } from "@/lib/utils"
<div className={cn("base-classes", conditionalClass, className)} />
```

**Variant patterns** (from `class-variance-authority`):
```tsx
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "bg-primary", destructive: "bg-destructive" },
    size: { default: "h-9 px-4", sm: "h-8 px-3", icon: "size-9" }
  }
})
```

### TailwindCSS 4 Features
- Custom dark mode variant: `dark:bg-input/30 dark:border-input`
- Container queries: `@container/card-header`
- CSS variables: `var(--background)`, `var(--foreground)` (defined in `app/globals.css`)

## Critical Security Rules

1. **Never expose Upstash credentials** - always decrypt server-side, never send to client
2. **Never bypass RLS** - all user data access must go through Drizzle with `user.id` checks
3. **Validate referrers** - check `allowedReferrers` array in `/api/search` before serving results
4. **Encrypt at rest** - use `encrypt()` for any Upstash tokens/URLs stored in DB
5. **Don't modify `neon_auth` schema** - it's managed by Neon for JWT validation

## Environment Variables

Required for production:
```bash
# Database
DATABASE_URL=postgres://...           # Neon connection string

# Stack Auth (public)
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...

# Stack Auth (secret)
STACK_SECRET_SERVER_KEY=...

# Upstash Search (shared across sites, encrypted per-site)
UPSTASH_SEARCH_REST_URL=...
UPSTASH_SEARCH_REST_TOKEN=...

# Encryption
ENCRYPTION_KEY=...                    # 32-char base64 string for AES-256-GCM
```

## Development Workflows

### Running RLS Setup
```bash
# Run scripts to enable RLS policies (do once after schema changes)
pnpm tsx scripts/setup-rls.ts
# Or manually in Neon SQL Editor: paste from migrations/enable_rls.sql
```

### Testing Auth Locally
1. Ensure `NEXT_PUBLIC_STACK_*` env vars are set
2. Visit `/auth/signin` (redirects to Stack Auth hosted page)
3. Sign in with Google/GitHub/email
4. Verify `stackApp.getUser()` returns user in API routes

### Debugging Search
1. Check `sites.allowedReferrers` includes request origin
2. Verify `quotas.queriesUsed < planLimit`
3. Check recent `analytics_query_events` count for rate limit
4. Inspect decrypted `upstashSearchUrl` / `upstashSearchToken` (server-side only)

## Common Gotchas

- **`users.id` is `varchar(255)`, not `uuid`** - Stack Auth uses string IDs
- **RLS requires `authenticated` role** - queries fail if JWT missing/invalid
- **Crawl throttle persists** - check `sites.nextCrawlAt` before re-crawling
- **Edge runtime crypto** - use `lib/crypto.edge.ts` (Web Crypto), not `lib/crypto.server.ts` (Node.js)
- **Always await `stackApp.getUser()`** - it's async, returns `null` if unauthenticated
