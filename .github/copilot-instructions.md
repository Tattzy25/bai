# Bridgit-AI Copilot Instructions

## Project Overview

**Bridgit-AI** is a Next.js 15 multi-tenant SaaS that enables fast, typo-tolerant search for static websites via Upstash Search. The goal: "From URL to live search in < 2 minutes."

**Core Value Proposition**: Site owners add a simple embed snippet to their website, and users get instant, beautiful search functionality with analytics.

### Architecture Summary
- **Frontend**: Next.js 15.5.7 (App Router, React 19, TypeScript 5, Turbopack bundler)
- **Database**: Neon Postgres with Drizzle ORM + Row-Level Security (RLS)
- **Authentication**: Neon Auth (Google, GitHub, email magic links via Resend) - fully managed, JWT-based
- **Search Engine**: Upstash Search (typo-tolerant, vector-based)
- **Deployment**: Vercel (Edge runtime for `/api/search` endpoint)
- **UI Library**: TailwindCSS 4 + shadcn/ui "new-york" style (32 components installed)

**Repository Size**: ~50 TypeScript/TSX files, 565-line vanilla JS widget, 172-line database schema

---

## Critical: Build & Environment Setup

### Prerequisites
- **Node.js 20.x** (v20.19.6 tested)
- **pnpm** (package manager - MUST use pnpm, not npm)

### Installation Steps

**ALWAYS run these commands in sequence:**

```bash
# 1. Install pnpm globally (if not already installed)
npm install -g pnpm

# 2. Install dependencies (takes ~15-20 seconds)
pnpm install

# 3. Setup environment variables (REQUIRED for build)
# Create .env.local with at minimum:
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
ENCRYPTION_KEY=<32-character-string>
UPSTASH_SEARCH_REST_URL=https://endpoint.upstash.io
UPSTASH_SEARCH_REST_TOKEN=<token>
```

**Environment Variable Notes**:
- `ENCRYPTION_KEY` MUST be exactly 32 characters (generate: `openssl rand -base64 32 | cut -c1-32`)
- For build testing only, dummy values work (e.g., `12345678901234567890123456789012`)
- Never commit `.env.local` or expose real credentials

### Build Process

**Available Scripts** (from `package.json`):
```bash
pnpm dev              # Start dev server with Turbopack (port 3000)
pnpm build            # Production build with Turbopack (~12-15s compile time)
pnpm start            # Start production server
pnpm lint             # Run ESLint 9 with flat config
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:migrate       # Apply migrations to Neon database
pnpm db:push          # Push schema changes directly (dev only)
pnpm db:studio        # Launch Drizzle Studio on localhost:4983
```

### Build Issues & Workarounds

**Known Issue #1: Google Fonts Network Error (CRITICAL)**
- **Symptom**: Build fails with "Failed to fetch `Geist` from Google Fonts" + "Failed to fetch `Geist Mono` from Google Fonts"
- **Cause**: Font loading requires internet access during build (blocked in restricted environments like GitHub Actions)
- **Workaround**: Temporarily comment out font imports in `app/layout.tsx`:
  
```typescript
// Before (lines 2, 6-14):
import { Geist, Geist_Mono } from "next/font/google";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// After (comment out):
// import { Geist, Geist_Mono } from "next/font/google";
// const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Also update line 29:
// Before:
className={`${geistSans.variable} ${geistMono.variable} antialiased`}
// After:
className="antialiased"
```

- **Impact**: Build will succeed without custom fonts; default system fonts used
- **When to use**: ALWAYS use this workaround in CI/CD pipelines or restricted networks
- **When to revert**: After successful build/deploy, or in local development with internet access

**Known Issue #2: ESLint Warnings Treated as Errors**
- **Symptom**: Build completes compilation but fails linting with warnings like:
  - `react/no-unescaped-entities` (lines with `"` or `'` in JSX)
  - `@typescript-eslint/no-unused-vars` (unused imports/variables)
- **Fix**: Use HTML entities in JSX text:
  - Replace `"` with `&quot;` or `&ldquo;`/`&rdquo;`
  - Replace `'` with `&apos;` or `&lsquo;`/`&rsquo;`
- **Example**: `Show "Powered by" badge` → `Show &quot;Powered by&quot; badge`

**Fixed ESLint Errors** (as of December 5, 2025):
1. `app/api/sites/route.ts:6` - Removed unused `Search` import from `@upstash/search`
2. `app/api/sites/route.ts:116` - Removed unused `request` parameter from GET function
3. `app/auth/signin/page.tsx:6` - Removed unused `router` from `useRouter()`
4. `app/auth/signup/page.tsx:6` - Removed unused `router` from `useRouter()`
5. `app/dashboard/page.tsx:14` - Removed unused `Site` type definition
6. `components/section-cards.tsx:1` - Removed unused `IconTrendingDown` import
7. `components/user-sidebar.tsx:3` - Removed unused `useState` import
8. `components/user-sidebar.tsx:70` - Prefixed unused `userId` with `_` to indicate intentional
9. `components/user-dashboard-sections/customize-search.tsx:69` - Fixed unescaped quotes with `&quot;`
10. `components/user-dashboard-sections/welcome.tsx:24` - Fixed unescaped apostrophe with `&apos;`

### Validation Commands

**ALWAYS validate changes in this order:**

```bash
# 1. Linting (catches unused vars and JSX issues)
pnpm lint   # ESLint 9 with Next.js config

# 2. Full build test (12-15 seconds if fonts work, or apply workaround)
pnpm build  # Must pass without errors

# 3. Type checking (implicit in build)
# TypeScript errors will fail compilation during build
```

**No test suite exists** - manual validation required for functional changes.

---

## Project Structure & Key Files

### Root Directory Files
```
bai/
├── .github/
│   ├── copilot-instructions.md        # This file
│   ├── AI_READ_THIS_FIRST.md          # Project context
│   └── [other docs]                   # Architecture docs
├── package.json                        # Scripts: dev, build, lint, db:*
├── tsconfig.json                       # TypeScript config (strict mode, @/ aliases)
├── next.config.ts                      # Next.js config (minimal, Turbopack default)
├── eslint.config.mjs                   # ESLint 9 flat config
├── drizzle.config.ts                   # Drizzle Kit config (schema: lib/db/schema.ts)
├── postcss.config.mjs                  # PostCSS with Tailwind 4
├── components.json                     # shadcn/ui config (new-york style, RSC)
├── middleware.ts                       # Route protection (JWT validation)
├── README.md                           # Comprehensive project documentation
├── SCHEMA_GUIDE.md                     # Database schema reference
├── NEXT_STEPS.md                       # Deployment checklist
├── WIDGET_DEVELOPMENT_GUIDE.md         # Widget architecture documentation
└── .env.local                          # Local environment variables (gitignored)
```

### Application Structure
```
app/
├── api/                                # API routes (Next.js App Router)
│   ├── search/route.ts                # Edge runtime search proxy (CRITICAL)
│   ├── crawl/route.ts                 # Background crawler webhook
│   ├── sites/route.ts                 # CRUD for user sites
│   └── sites/[id]/reindex/route.ts    # Manual reindex trigger
├── auth/                               # Authentication pages
│   ├── signin/page.tsx                # Sign-in UI (placeholder)
│   └── signup/page.tsx                # Sign-up UI (placeholder)
├── dashboard/                          # Protected dashboard
│   ├── page.tsx                       # Main dashboard view
│   └── [userId]/page.tsx              # User-specific dashboard
├── layout.tsx                          # Root layout (fonts, providers)
├── page.tsx                            # Landing page
├── providers.tsx                       # Client-side providers (theme)
└── globals.css                         # TailwindCSS + CSS variables
```

### Library & Components
```
lib/
├── db/
│   ├── index.ts                       # Drizzle client + Neon connection
│   └── schema.ts                      # Database schema (172 lines, 9 tables)
├── crypto.server.ts                    # Node.js crypto (encrypt/decrypt/generatePublicKey)
├── crypto.edge.ts                      # Web Crypto API for Edge runtime
└── utils.ts                            # cn() utility for className merging

components/
├── ui/                                 # shadcn/ui primitives (32 components)
│   ├── button.tsx                     # Button with variants (cva)
│   ├── dialog.tsx                     # Modal/dialog primitives
│   ├── input.tsx                      # Form input
│   └── [28 more components]           # Full shadcn/ui suite
├── app-sidebar.tsx                     # Dashboard sidebar navigation
├── data-table.tsx                      # TanStack Table wrapper
├── user-dashboard-sections/           # Dashboard feature sections
│   ├── welcome.tsx                    # Welcome section
│   └── customize-search.tsx           # Widget customization
└── [other components]                  # Feature-specific components

public/
└── embed.js                            # Embeddable search widget (565 lines, vanilla JS)

drizzle/
├── 0000_*.sql                          # Generated migrations
└── meta/                               # Migration metadata
```

---

## Database Schema & Authentication

### Neon Auth (CRITICAL - DO NOT BYPASS)

**This project uses Neon Auth exclusively** - DO NOT add Stack Auth, Clerk, Auth0, or other auth providers.

**How Neon Auth Works**:
1. User authenticates via Neon-hosted UI (Google, GitHub, email magic links)
2. Neon Auth issues JWT with `user_id` claim
3. All API requests include JWT in `Authorization: Bearer <token>` header
4. Neon Data API validates JWT automatically
5. Row-Level Security (RLS) enforces data isolation via `auth.user_id()` function

**Schema: `neon_auth` (system-managed, READ-ONLY)**
- Managed entirely by Neon platform
- Contains `neon_auth.users` table (synced to `public.users`)
- NEVER modify `neon_auth` schema directly

### Core Tables (9 tables, RLS-enabled)

**`users`** - User profiles (synced from Neon Auth)
```sql
id VARCHAR(255) PRIMARY KEY           -- Neon Auth user ID (e.g., '3d62940c-006e-...')
email VARCHAR(255) NOT NULL UNIQUE
name VARCHAR(255)
image TEXT
createdAt TIMESTAMP DEFAULT NOW()
```
**RLS**: Public table (user creation handled by Neon Auth)

**`sites`** - Customer websites (one per search site)
```sql
id UUID PRIMARY KEY
userId VARCHAR(255) REFERENCES users  -- Owner
publicKey VARCHAR(255) UNIQUE         -- Format: 'bai_<32-hex-chars>'
domain VARCHAR(255)                   -- e.g., 'https://docs.example.com'
allowedReferrers TEXT[]               -- CORS-style origin validation
plan VARCHAR(50) DEFAULT 'free'       -- 'free' | 'pro' | 'business'
status VARCHAR(50) DEFAULT 'pending'  -- 'pending' | 'active' | 'failed'
pagesIndexed INTEGER DEFAULT 0
nextCrawlAt TIMESTAMP                 -- Throttle: next allowed crawl
createdAt TIMESTAMP DEFAULT NOW()
```
**RLS**: `WHERE user_id = auth.user_id()`

**`quotas`** - Usage limits per site
```sql
siteId UUID REFERENCES sites UNIQUE
queriesUsed INTEGER DEFAULT 0
pagesCrawled INTEGER DEFAULT 0
resetAt TIMESTAMP                     -- Monthly reset
```
**Plan Limits**:
- Free: 1,000 queries/month, 60 QPM, 30min crawl throttle
- Pro: 10,000 queries/month, 600 QPM, 10min crawl throttle
- Business: 100,000 queries/month, 6,000 QPM, 2min crawl throttle

**`analytics_query_events`** - Search analytics
```sql
id UUID PRIMARY KEY
siteId UUID REFERENCES sites
query TEXT                            -- Search query text
resultsCount INTEGER                  -- Number of results returned
latencyMs INTEGER                     -- Response time in ms
selectedDocId TEXT                    -- Clicked result (if any)
createdAt TIMESTAMP
```
**RLS**: Indirect via sites table

---

## API Endpoints & Edge Runtime

### `/api/search` - Search Proxy (Edge Runtime)

**CRITICAL**: MUST use Edge runtime for global low latency (~50ms target)

```typescript
export const runtime = 'edge'  // REQUIRED at top of route.ts
```

**Request Flow**:
1. Extract `q` (query) and `siteKey` from URL params
2. Validate referrer against `sites.allowedReferrers` (403 if mismatch)
3. Check monthly quota: `quotas.queriesUsed < PLAN_LIMITS[plan]` (429 if exceeded)
4. Rate limit: Count analytics events in last 60s (429 if over limit)
5. Decrypt Upstash credentials via `decrypt()` from `lib/crypto.edge.ts` (async Web Crypto)
6. Query Upstash Search: `index.search({ query, limit: 10, reranking: true })`
7. Log analytics event (fire-and-forget): query, results count, latency
8. Increment `quotas.queriesUsed` (fire-and-forget)
9. Return results JSON

**Error Codes**:
- 400: Missing `q` or `siteKey`
- 403: Referrer not in `allowedReferrers`
- 404: Invalid `siteKey`
- 429: Quota exceeded or rate limit hit
- 500: Search index not configured or query failed

---

## Widget Development (`public/embed.js`)

**Architecture**: 565-line vanilla JavaScript embeddable widget (no dependencies)

**Features**:
- Floating search button (configurable position: bottom-right, bottom-left, top-right, top-left)
- Modal overlay with search input
- Debounced search requests (300ms)
- Result rendering with title, snippet, URL
- Click tracking for analytics
- Keyboard shortcuts: `Cmd+K`/`Ctrl+K` to open, `Esc` to close, arrow keys for navigation
- Responsive design (mobile-friendly)
- Customizable theming via CSS variables

**Configuration** (via `<script>` tag attributes):
```html
<script 
  src="https://cdn.bridgit-ai.com/embed.js" 
  data-site-key="bai_abc123..."      <!-- REQUIRED -->
  data-endpoint="/api/search"        <!-- Default: /api/search -->
  data-accent="#6366f1"              <!-- Brand color (default: indigo) -->
  data-position="bottom-right"       <!-- Button position -->
  defer>
</script>
```

---

## shadcn/ui Components (32 Installed)

**Configuration**: "new-york" style, RSC enabled, CSS variables for theming

**Adding Components**:
```bash
npx shadcn@latest add [component-name]  # Installs to @/components/ui
```

**Installed Components** (use these before creating custom UI):
- Button, Input, Label, Textarea
- Dialog, Drawer, Popover, Tooltip, Dropdown Menu
- Card, Separator, Avatar, Badge
- Checkbox, Radio Group, Select, Switch, Toggle
- Tabs, Collapsible, Navigation Menu
- Data Table (TanStack Table wrapper)
- Form (react-hook-form integration)

**ALWAYS use `cn()` for className merging**:
```tsx
import { cn } from "@/lib/utils"
<div className={cn("base-classes", conditionalClass, props.className)} />
```

---

## Common Gotchas & Known Issues

1. **Google Fonts build failure** - ALWAYS apply fonts workaround in CI/CD (see "Build Issues" section)
2. **ESLint treats warnings as errors** - Fix unused imports/vars and `react/no-unescaped-entities` before build
3. **`users.id` is `varchar(255)`, NOT `uuid`** - Neon Auth uses string IDs
4. **Edge runtime crypto** - Use `lib/crypto.edge.ts` (async Web Crypto), NOT `lib/crypto.server.ts` (Node.js)
5. **Referrer validation case-sensitive** - `allowedReferrers` must match origin exactly (protocol + domain + port)
6. **Encryption key length** - `ENCRYPTION_KEY` must be exactly 32 characters for AES-256-GCM
7. **Never modify `neon_auth` schema** - It's system-managed by Neon

---

## Quick Reference: Common Commands

```bash
# Development
pnpm dev                    # Start dev server (http://localhost:3000)
pnpm build                  # Production build (~12-15s) - apply fonts workaround if needed
pnpm start                  # Start production server

# Database
pnpm db:generate            # Generate migrations from schema
pnpm db:migrate             # Apply migrations to Neon
pnpm db:push                # Push schema changes (dev only)
pnpm db:studio              # Open Drizzle Studio (localhost:4983)

# Code Quality
pnpm lint                   # Run ESLint 9 - fix errors before build
```

**Build Success Criteria**:
- Compilation completes (~12-15s)
- No TypeScript errors
- No ESLint errors (all warnings fixed as of Dec 5, 2025)
- Static pages generated (10 routes)

---

## Priority Information for Coding Agents

### When Starting a New Task:

1. **ALWAYS install pnpm and dependencies first**: `npm install -g pnpm && pnpm install`
2. **ALWAYS create `.env.local` with minimum required vars** (see "Environment Setup" section)
3. **ALWAYS apply Google Fonts workaround** if building in restricted network (see "Build Issues")
4. **Run `pnpm lint` early** to catch unused imports/vars before build
5. **Never modify `neon_auth` schema** - it's system-managed by Neon
6. **Use shadcn/ui components** - 32 already installed, avoid creating custom UI primitives
7. **Edge runtime restrictions** - use `lib/crypto.edge.ts`, NOT `lib/crypto.server.ts`

### When Making Changes:

1. **Minimal edits** - change as few lines as possible
2. **Fix lint warnings immediately** - remove unused imports/vars, escape JSX entities
3. **Test incrementally** - run `pnpm lint` and `pnpm build` after each change
4. **Security first** - never expose credentials, always use encryption for sensitive data

### Focus Areas (Per Problem Statement):

**Primary Deliverable**: Embeddable search widget (`public/embed.js` - 565 lines already complete)
- Multiple styles: floating bubble (✅), docked bar (⏳), embedded bar (⏳)
- Customization: colors (✅), position (✅), theming (✅)
- Analytics: CTR tracking (✅), latency logging (✅), zero-result tracking (⏳)

**Dashboard Analytics**: Extend existing analytics to show:
- Top queries (database: `analytics_query_events`, group by `query`)
- Zero-result queries (filter where `resultsCount = 0`)
- Click-through rates (track `selectedDocId` in analytics events)

**Use Existing Components**:
- 32 shadcn/ui components in `components/ui/`
- Dashboard sections in `components/user-dashboard-sections/`
- DO NOT recreate HTML components - extend existing ones

---

**Last Updated**: December 5, 2025  
**Repository**: https://github.com/Tattzy25/bai  
**Build Status**: ✅ All ESLint errors fixed, Google Fonts workaround documented
