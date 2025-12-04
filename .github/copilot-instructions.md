# Bridgit-AI Copilot Instructions

## Project Overview

Bridgit-AI is a Next.js 15 multi-tenant SaaS that enables fast, typo-tolerant search for static websites via Upstash Search. Goal: "From URL to live search in < 2 minutes."

**Core Architecture**: Neon-managed authentication + encrypted multi-tenant search
1. **Neon Auth** → Handles ALL authentication (Google, GitHub, Resend email), JWT issuance, database RLS
2. **Neon Data API** → PostgREST-compatible API with automatic JWT validation and RLS enforcement
3. **Upstash Search** → Per-site encrypted credentials with referrer-validated Edge API

**Critical**: Neon Auth manages the entire authentication flow. Do NOT add Stack Auth, Auth0, Clerk, or any other auth provider - Neon handles everything including:
- User sign-up/sign-in (Google, GitHub, email magic links via Resend)
- JWT token issuance with `user_id` claim
- Database Row-Level Security (RLS) policy enforcement via `auth.user_id()`
- The `neon_auth` schema (system-managed, do not touch)

**Data Flow**: User adds site → Background crawler indexes content → Embed widget queries Edge API → Results served with plan-based quotas/rate limits → Analytics tracked per-site.

## Stack & Build System

- **Framework**: Next.js 15.5.7 (App Router, React 19, TypeScript 5, Turbopack)
- **Database**: Neon Postgres + Drizzle ORM (schema: `lib/db/schema.ts`)
- **Auth**: Neon Auth (managed by Neon - Google, GitHub, Resend email)
- **Search**: Upstash Search + Crawler (`@upstash/search`, `@upstash/search-crawler`)
- **UI**: TailwindCSS 4, shadcn/ui "new-york" style, `lucide-react` icons
- **Deployment**: Vercel (Edge runtime for `/api/search` and `/api/sites/[id]/reindex`)

### Dev Commands
```bash
pnpm dev              # Dev server with Turbopack
pnpm build            # Production build (uses Turbopack)
pnpm start            # Production server
pnpm lint             # ESLint 9 with flat config
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:migrate       # Apply migrations to Neon database
pnpm db:push          # Push schema changes directly (dev only)
pnpm db:studio        # Launch Drizzle Studio on localhost:4983
```

**Build Notes**: Turbopack is the default bundler (both dev & build). All TypeScript paths use `@/` aliases configured in `tsconfig.json` and `components.json`.

## Project Structure & File Organization

```
bai/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes (Edge & Node runtimes)
│   │   ├── search/route.ts     # Edge: Proxy search queries to Upstash
│   │   ├── crawl/route.ts      # Background crawler executor
│   │   └── sites/              # CRUD for user sites
│   ├── auth/                    # Neon Auth UI pages (if custom)
│   ├── dashboard/               # Protected user dashboard
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # Client-side providers (theme, etc.)
│   └── globals.css              # TailwindCSS + CSS variables
├── lib/
│   ├── db/
│   │   ├── index.ts            # Drizzle client + connection
│   │   └── schema.ts           # Database schema (173 lines)
│   ├── crypto.server.ts         # Node.js crypto (encrypt/decrypt/generatePublicKey)
│   ├── crypto.edge.ts           # Web Crypto API for Edge runtime
│   └── utils.ts                 # cn() utility, etc.
├── components/
│   ├── ui/                      # shadcn/ui components (Button, Input, etc.)
│   ├── app-sidebar.tsx          # Dashboard sidebar navigation
│   ├── data-table.tsx           # Reusable table with TanStack Table
│   └── [other].tsx              # Feature-specific components
├── public/
│   └── embed.js                 # Embeddable search widget (566 lines)
├── drizzle/                     # Generated migrations
│   ├── 0000_*.sql
│   └── meta/                    # Migration metadata
├── middleware.ts                # Route protection (JWT validation)
├── drizzle.config.ts            # Drizzle Kit configuration
└── components.json              # shadcn/ui configuration
```

### File Naming Conventions
- API routes: `route.ts` (Next.js App Router convention)
- Server Components: `page.tsx`, `layout.tsx`
- Client Components: Must have `"use client"` directive at top
- UI components: `kebab-case.tsx` (e.g., `button.tsx`, `data-table.tsx`)
- Schema/utilities: `kebab-case.ts` or descriptive names (e.g., `crypto.server.ts`)

### Component Organization
- **Place UI primitives** in `components/ui/` (shadcn/ui managed)
- **Place feature components** in `components/` root (e.g., `app-sidebar.tsx`, `nav-documents.tsx`)
- **Use `"use client"`** sparingly - prefer Server Components by default
- **Co-locate data fetching** with Server Components (use Drizzle queries directly)

## Authentication Architecture (CRITICAL)

### Neon Auth - Fully Managed by Neon

**IMPORTANT**: This project uses **Neon Auth** - a complete authentication solution managed entirely by Neon. Do NOT add Stack Auth, Clerk, Auth0, or any other auth provider.

**How Neon Auth Works**:
1. **User authentication** → Neon Auth handles sign-in via Google, GitHub, or Resend email magic links
2. **JWT issuance** → Neon Auth generates JWT with `user_id` claim  
3. **Database access** → Neon Data API validates JWT and enforces RLS automatically
4. **RLS enforcement** → Postgres `auth.user_id()` function extracts `user_id` from JWT for row-level policies

**No manual authentication code needed** - Neon handles:
- Auth UI and user flows
- JWT token generation and validation
- Session management
- The `neon_auth` system schema (read-only)
- Automatic RLS enforcement via `auth.user_id()` function

### Accessing User Data

**In API Routes** (use Neon Data API):
```typescript
// Neon Data API validates JWT automatically from Authorization header
// Access user ID via auth.user_id() in SQL/Drizzle queries
GET /api/search?q=...&siteKey=...
Authorization: Bearer <neon-jwt-token>

// RLS policies automatically filter by auth.user_id()
```

**For database operations**:
```typescript
// RLS policies use auth.user_id() - no manual user checks needed
const sites = await db.query.sites.findMany()  
// Returns only rows where user_id = auth.user_id()
```

### RLS Policy Pattern

All user-owned tables use this pattern (defined in Drizzle `lib/db/schema.ts`):
```typescript
// Drizzle RLS policy using crudPolicy helper
crudPolicy({
  role: authenticatedRole,
  read: authUid(table.userId),    // Checks user_id = auth.user_id()
  modify: authUid(table.userId),
});

// Or with raw SQL for indirect ownership:
crudPolicy({
  role: authenticatedRole,
  read: sql`(SELECT sites.user_id = auth.user_id() FROM sites WHERE sites.id = ${table.siteId})`,
  modify: sql`(SELECT sites.user_id = auth.user_id() FROM sites WHERE sites.id = ${table.siteId})`,
});
```

**⚠️ NEVER modify `neon_auth` schema** - it's system-managed by Neon for JWT validation and user sync.

## Database Schema & Relationships

### Core Tables (all use UUID primary keys except `users`)

**`users`** - Neon Auth user records (synced from `neon_auth` schema)
- `id: varchar(255)` (Neon Auth user ID, e.g., `'3d62940c-006e-...'`)
- `email`, `name`, `image`, `createdAt`
- **Note**: User creation/management handled by Neon Auth, not application code

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
- Plan limits: 
  - **free**: 1,000 queries/month, 60 QPM rate limit, 30min crawl throttle
  - **pro**: 10,000 queries/month, 600 QPM rate limit, 10min crawl throttle
  - **business**: 100,000 queries/month, 6,000 QPM rate limit, 2min crawl throttle

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

1. Extract JWT from `Authorization` header (Neon Data API validates automatically)
2. Generate unique `publicKey` via `generatePublicKey()` (from `lib/crypto.server.ts`)
3. Create `sites` record - `userId` populated from `auth.user_id()` (RLS auto-enforces ownership)
4. Encrypt Upstash credentials and store in `search_indexes`
5. Initialize `quotas` record (reset monthly)
6. Enqueue `crawl_jobs` record (status: `'queued'`)

**Key Pattern**: RLS policies automatically set `userId = auth.user_id()` - users can't write to others' data.

### `GET /api/search` - Edge Runtime Search Proxy

**Flow**:
1. Extract `siteKey` + `q` (query) from URL params
2. Lookup site by `publicKey` with relations: `searchIndex`, `quota`
3. Validate referrer against `sites.allowedReferrers` (prevents hotlinking, 403 if fails)
4. Check monthly quota: `quotas.queriesUsed < PLAN_LIMITS[plan]` (429 if exceeded)
5. Rate limit: Count `analytics_query_events` in last 60s (429 if over 60/600/6000 QPM)
6. Decrypt `search_indexes` credentials via `decrypt()` from `lib/crypto.edge.ts`
7. Query Upstash Search with `index.search({ query, limit: 10, reranking: true })`
8. Log analytics event (fire-and-forget): query, results count, latency
9. Increment `quotas.queriesUsed` (fire-and-forget)
10. Return results JSON with `poweredBy: 'Bridgit-AI'` if `brandingEnabled = true`

**Runtime**: MUST use Edge (`export const runtime = 'edge'`) for global low latency (~50ms target).

**Error responses**:
- 400: Missing `q` or `siteKey`
- 403: Referrer not in `allowedReferrers`
- 404: Invalid `siteKey`
- 429: Quota exceeded or rate limit hit
- 500: Search index not configured or query failed

### `POST /api/crawl` - Background Crawl Executor

**Flow**:
1. Extract `siteId` + `crawlJobId` from request body
2. Fetch site with relations: `searchIndex`, `quota`
3. Check throttle: reject if `sites.nextCrawlAt > now` (429 with `nextAllowedAt`)
4. Update `crawl_jobs` status to `'running'`, set `startedAt`
5. Decrypt Upstash credentials using `lib/crypto.server.ts` (Node runtime)
6. Call `crawlAndIndex({ upstashUrl, upstashToken, indexName, docUrl, silent: true })`
7. On success:
   - Update `sites`: `status = 'active'`, `lastCrawlAt = now`, `pagesIndexed`, `nextCrawlAt`
   - Update `crawl_jobs`: `status = 'complete'`, `finishedAt`, `pagesIndexed`
   - Increment `quotas.pagesCrawled` (fire-and-forget)
8. On error:
   - Update `crawl_jobs`: `status = 'failed'`, `finishedAt`, `errorMessage`
   - Update `sites`: `status = 'failed'`

**Throttle Logic**: `nextCrawlAt = now + throttleMinutes * 60 * 1000` where throttleMinutes = 30 (free) | 10 (pro) | 2 (business).

**Note**: This endpoint is typically triggered by Upstash Workflow or cron jobs, not directly by users.

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
import { encrypt, decrypt } from "@/lib/crypto.server"
```

### shadcn/ui Conventions

**Configuration**: Uses "new-york" style variant with neutral base color, RSC enabled, CSS variables for theming.

**Adding components**:
```bash
npx shadcn@latest add [component-name]  # Installs to @/components/ui
```

**Component structure** (see `components/ui/button.tsx` for reference):
- Uses `class-variance-authority` (cva) for variant management
- Implements `asChild` prop pattern with `@radix-ui/react-slot`
- Includes focus-visible rings, aria-invalid states, size variants
- All UI components export both component and variants function

**Always use `cn()` for className merging**:
```tsx
import { cn } from "@/lib/utils"
<div className={cn("base-classes", conditionalClass, className)} />
```

**Variant patterns** (from `class-variance-authority`):
```tsx
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { 
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-white hover:bg-destructive/90",
      outline: "border bg-background shadow-xs hover:bg-accent",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    },
    size: { 
      default: "h-9 px-4 py-2", 
      sm: "h-8 px-3", 
      icon: "size-9" 
    }
  },
  defaultVariants: { variant: "default", size: "default" }
})
```

### TailwindCSS 4 Features
- Dark mode variants: `dark:bg-input/30 dark:border-input dark:hover:bg-input/50`
- Container queries: `@container/card-header`
- CSS variables: `var(--background)`, `var(--foreground)`, `var(--primary)` (defined in `app/globals.css`)
- Opacity modifiers: `bg-primary/90`, `ring-destructive/20`
- Size utilities: `size-9` (both width and height), `gap-2`, `shrink-0`

## Route Protection & Middleware

**Middleware** (`middleware.ts`) protects `/app/*` routes (dashboard, settings, etc.).

### Protected vs Public Routes
```typescript
// Public (no auth required)
/                         // Landing page
/api/search              // Public search endpoint (validates JWT internally)
/api/*                   // All API routes (validate JWT as needed)

// Protected (requires Neon Auth JWT)
/app/*                   // Dashboard, user-facing app routes
/dashboard/*             // Protected dashboard routes
```

**Pattern**: API routes validate JWT from `Authorization: Bearer <token>` header. Neon Data API enforces RLS automatically.

### Adding New Protected Routes
1. Place under `/app/*` directory structure (auto-protected by middleware)
2. Access user in Server Components: `const user = await stackApp.getUser()`
3. For API routes under `/api`, manually check auth: 
```typescript
const user = await stackApp.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

## Critical Security Rules

1. **Never expose Upstash credentials** - Always decrypt server-side in API routes/Server Components, never send to client
2. **Never bypass RLS** - All user data access MUST go through Drizzle queries with `user.id` checks (RLS enforces automatically)
3. **Validate referrers** - Check `allowedReferrers` array in `/api/search` before serving results (prevents hotlinking)
4. **Encrypt at rest** - Use `encrypt()` from `lib/crypto.server.ts` for ANY Upstash tokens/URLs stored in database
5. **Don't modify `neon_auth` schema** - It's managed by Neon for JWT validation (system schema, read-only)
6. **Edge runtime restrictions** - Use `lib/crypto.edge.ts` for Edge routes (no Node.js `crypto` module available)

## Environment Variables

**Location**: Store in `.env.local` (gitignored) for local dev, use Vercel dashboard for production.

### Required Variables
```bash
# Database (Neon Postgres)
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
# Format: postgres://[user]:[password]@[neon-host]/[dbname]?sslmode=require
# Get from: Neon Console → Connection Details → Connection String

# Neon Auth (managed by Neon - no env vars needed)
# Authentication is handled entirely by Neon platform
# Users authenticate via Neon-hosted UI or Data API

# Upstash Search (Master credentials - shared across sites)
UPSTASH_SEARCH_REST_URL=https://[endpoint].upstash.io
UPSTASH_SEARCH_REST_TOKEN=...
# Get from: Upstash Console → Search Index → REST API
# Note: These get encrypted per-site in `search_indexes` table

# Encryption (AES-256-GCM)
ENCRYPTION_KEY=...
# Generate: openssl rand -base64 32 | cut -c1-32
# MUST be exactly 32 characters
```

### Optional Variables
```bash
# Development
NODE_ENV=development              # Auto-set by Next.js
PORT=3000                        # Dev server port (default: 3000)

# Monitoring/Analytics (if integrated)
NEXT_PUBLIC_ANALYTICS_ID=...
```

**Security Notes**:
- Never commit `.env.local` or expose `ENCRYPTION_KEY` in logs
- `NEXT_PUBLIC_*` vars are embedded in client bundle (use only for non-sensitive data)
- Rotate `ENCRYPTION_KEY` requires re-encrypting all `search_indexes` credentials

## Development Workflows

### Database Schema Changes
1. Update `lib/db/schema.ts` with new tables/columns
2. Run `pnpm db:generate` to create migration files in `drizzle/`
3. Run `pnpm db:migrate` to apply to Neon database
4. If adding user-owned tables, update RLS policies (see RLS section)

**Quick iteration** (dev only): Use `pnpm db:push` to sync schema without generating migration files.

### Running RLS Setup
```bash
# After schema changes, enable RLS on new tables (do once)
pnpm tsx scripts/setup-rls.ts
# Or manually in Neon SQL Editor: paste from migrations/enable_rls.sql
```

### Testing Auth with Neon
1. Enable Neon Auth in Neon Console when enabling Data API
2. Users authenticate via Neon-hosted auth UI (Google, GitHub, Resend email)
3. Neon Auth issues JWT tokens automatically
4. Include JWT in `Authorization: Bearer <token>` header for API requests
5. RLS policies automatically enforce user isolation via `auth.user_id()`

### Debugging Search Widget (`public/embed.js`)
1. **Test locally**: Change `data-endpoint` to `http://localhost:3000/api/search` in HTML snippet
2. **Check referrer**: Verify `sites.allowedReferrers` array includes request origin (e.g., `http://localhost:8000`)
3. **Monitor browser console**: Widget logs errors like `[Bridgit-AI] Missing data-site-key`
4. **Network tab**: Inspect `/api/search?q=...&siteKey=...` responses for 403/429 errors
5. **Test quotas**: Check `quotas.queriesUsed` against plan limits in Drizzle Studio

### Debugging Search API
1. Check `sites.allowedReferrers` includes request origin
2. Verify `quotas.queriesUsed < planLimit` (1K/10K/100K for free/pro/business)
3. Check recent `analytics_query_events` count for rate limit (60/600/6000 per minute)
4. Inspect decrypted `upstashSearchUrl`/`upstashSearchToken` server-side (never log in prod)
5. Validate `sites.status = 'active'` (not `'pending'` or `'failed'`)

## Widget Development (`public/embed.js`)

**Architecture**: Vanilla JavaScript embeddable widget (566 lines, no dependencies) that creates floating search button + modal.

### Key Features
- **Configuration**: Reads `data-site-key`, `data-endpoint`, `data-accent`, `data-position` from `<script>` tag
- **Styling**: Inline CSS with CSS variables for theming (`--bridgit-accent`, `--bridgit-text-primary`, etc.)
- **Search flow**: Debounced fetch to `/api/search` → renders results → tracks clicks
- **Keyboard**: `Cmd+K`/`Ctrl+K` to open, `Esc` to close, arrow keys for navigation
- **Responsive**: Mobile-friendly with 90% width modal, max 600px

### Adding Widget to Site
```html
<script 
  src="https://cdn.bridgit-ai.com/embed.js" 
  data-site-key="bai_abc123..."
  data-accent="#6366f1"
  data-position="bottom-right"
  defer>
</script>
```

**Local testing**: Change `src` to `http://localhost:3000/embed.js` and set `data-endpoint="http://localhost:3000/api/search"`

### Widget Customization Points
- `data-accent`: Primary color (default: `#6366f1` indigo)
- `data-position`: `'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`
- Branding: Shows "Powered by Bridgit-AI" if `sites.brandingEnabled = true` (free plan default)

**Widget structure**: Button → Modal overlay → Header + Search input → Results list → Footer branding

## Common Gotchas

- **`users.id` is `varchar(255)`, not `uuid`** - Neon Auth uses string IDs like `'3d62940c-006e-4b7d-bc8...'`
- **RLS requires `authenticated` role** - All queries fail if JWT missing/invalid (returns 0 rows, not error)
- **Crawl throttle persists** - Always check `sites.nextCrawlAt` before re-crawling (plan-based: 30/10/2 min)
- **Edge runtime crypto** - Use `lib/crypto.edge.ts` (Web Crypto API, async), not `lib/crypto.server.ts` (Node.js `crypto`)
- **JWT validation automatic** - Neon Data API validates JWT from `Authorization` header, enforces RLS automatically
- **Referrer validation case-sensitive** - `allowedReferrers` array must match origin exactly (protocol + domain + port)
- **Widget CORS**: Add widget host origin to `sites.allowedReferrers` array, not just site domain
- **Encryption key length** - `ENCRYPTION_KEY` must be exactly 32 characters for AES-256-GCM (base64 string)

## Quick Reference: Common Tasks

### Adding a New API Route
```typescript
// app/api/[name]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  // Neon Data API validates JWT from Authorization header
  // RLS policies automatically filter by auth.user_id()
  
  // Query DB - RLS enforces user isolation automatically
  const data = await db.query.sites.findMany()
  return NextResponse.json({ data })
}
```

### Querying with Relations
```typescript
const site = await db.query.sites.findFirst({
  where: eq(sites.id, siteId),
  with: {
    searchIndex: true,      // 1:1 relation
    quota: true,            // 1:1 relation
    crawlJobs: {            // 1:many relation
      orderBy: (crawlJobs, { desc }) => [desc(crawlJobs.createdAt)],
      limit: 10,
    },
  },
})
```

### Adding a New shadcn/ui Component
```bash
npx shadcn@latest add dialog       # Adds components/ui/dialog.tsx
npx shadcn@latest add form         # Adds form primitives + react-hook-form integration
```

### Server Component with Data Fetching
```tsx
// app/dashboard/page.tsx (Server Component by default)
import { db } from '@/lib/db'

export default async function DashboardPage() {
  // RLS automatically filters to current user's data
  const sites = await db.query.sites.findMany()
  
  return <div>Your Sites: {sites.length}</div>
}
```

### Client Component with API Call
```tsx
"use client"
import { useEffect, useState } from 'react'

export function UserSites() {
  const [sites, setSites] = useState([])
  
  useEffect(() => {
    // Include Neon Auth JWT in Authorization header
    fetch('/api/sites', {
      headers: { 'Authorization': `Bearer ${neonAuthToken}` }
    })
      .then(res => res.json())
      .then(data => setSites(data))
  }, [])
  
  return <div>{sites.map(site => site.name)}</div>
}
```

### Encrypting Sensitive Data
```typescript
// Server-side only (API routes, Server Components)
import { encrypt, decrypt } from '@/lib/crypto.server'

const encrypted = encrypt('my-secret-token')
await db.insert(searchIndexes).values({ upstashSearchToken: encrypted })

// Later...
const decrypted = decrypt(row.upstashSearchToken)

// Edge runtime (use async Web Crypto)
import { decrypt } from '@/lib/crypto.edge'
const decrypted = await decrypt(encrypted)
```
