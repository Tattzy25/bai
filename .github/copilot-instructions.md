# Bridgit-AI Copilot Instructions

## Project Overview

Bridgit-AI is a Next.js 15 application for adding fast, typo-tolerant search to static sites via Upstash Search. The goal: "From URL to live search in < 2 minutes." This is a multi-tenant SaaS where each site gets its own search index provisioned via Upstash, with scheduled crawling via Upstash Workflow.

**Key Architecture Decision**: Never expose Upstash credentials client-side. Search queries go through `/api/search` (Edge runtime) which validates referrers and maps public `siteKey` to internal credentials.

## Stack & Build System

- **Framework**: Next.js 15.5.7 with App Router, React 19, TypeScript 5
- **Build Commands**: 
  - Dev: `pnpm dev` (uses Turbopack)
  - Build: `pnpm build --turbopack`
  - Lint: `pnpm lint` (uses ESLint 9 flat config)
- **UI**: TailwindCSS 4 (with Postcss plugin), shadcn/ui "new-york" style, `tw-animate-css` for animations
- **Icons**: `lucide-react` (via shadcn config)
- **Deployment**: Vercel (Edge functions where applicable)

## Import Paths & Module Resolution

Use `@/` prefix for all imports (tsconfig paths):
- `@/components/ui/button` - shadcn/ui components
- `@/lib/utils` - utility functions (notably the `cn()` helper)
- `@/app` - app router pages/layouts

Example:
```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

## Component Architecture

### shadcn/ui Patterns

All UI components in `components/ui/` follow these conventions:

1. **`data-slot` attributes** for styling hooks:
   ```tsx
   <div data-slot="card" className={cn("bg-card text-card-foreground ...", className)} />
   ```

2. **Compound Components**: Export multiple related components from one file (e.g., `Card`, `CardHeader`, `CardTitle`, `CardDescription`).

3. **Variant-based Styling**: Use `class-variance-authority` (cva) for button/component variants:
   ```tsx
   const buttonVariants = cva("base-classes", {
     variants: {
       variant: { default: "...", destructive: "..." },
       size: { default: "h-9 px-4", sm: "h-8 px-3", icon: "size-9" }
     }
   })
   ```

4. **`cn()` utility**: Always merge className props with `cn()` from `@/lib/utils` (combines `clsx` + `tailwind-merge`).

5. **Radix UI Primitives**: Most interactive components wrap Radix primitives (`@radix-ui/react-*`). Use their slot/asChild patterns.

### Focus/Accessibility Classes

Components include extensive focus-visible states:
```tsx
className="outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```
Also `aria-invalid` states for form validation.

## Data Flow & External Services

### Planned Multi-Tenant Architecture

Each site gets:
- A unique `public_key` (used in embed snippet)
- Dedicated Upstash Search index (URL + token stored encrypted in DB)
- `allowed_referrers` list for CORS-style validation

### API Endpoints (To Be Built)

- `POST /api/sites` - Create site, provision Upstash index, enqueue crawl
- `POST /api/sites/[id]/reindex` - Trigger re-crawl
- `GET /api/search` (Edge) - Validate `siteKey` + referrer, query Upstash, log analytics
- `POST /api/webhooks/workflow` - Upstash Workflow callbacks for crawl status

### Crawling Integration

Uses `@upstash/search-crawler` (see `upstash-crawl.md`):
```typescript
import { crawlAndIndex } from '@upstash/search-crawler';
const result = await crawlAndIndex({
  upstashUrl: process.env.UPSTASH_SEARCH_REST_URL,
  upstashToken: process.env.UPSTASH_SEARCH_REST_TOKEN,
  indexName: 'site-123',
  docUrl: 'https://example.com',
  silent: true
});
```

### Search Integration

Uses `@upstash/search` (see `upstash-search.md`):
```typescript
import { Search } from "@upstash/search";
const client = Search.fromEnv();
const results = await index.search({
  query: "space opera",
  limit: 2,
  filter: "genre = 'sci-fi'",
  reranking: true
});
```

## Styling Conventions

### TailwindCSS 4 Features

- Uses `@import "tailwindcss"` (Postcss plugin)
- Custom variant: `@custom-variant dark (&:is(.dark *))`
- Theme colors via `@theme inline` block in `app/globals.css`
- CSS variables for colors (e.g., `--color-background: var(--background)`)

### Common Patterns

- Responsive containers: `@container/card-header` with container queries
- Dark mode: `dark:bg-input/30 dark:border-input`
- Grid layouts: `grid auto-rows-min grid-rows-[auto_auto]`
- Flex patterns: `flex flex-col gap-6` (consistent spacing)

## Development Workflows

### Adding shadcn/ui Components

shadcn/ui is pre-configured (see `components.json`). To add new components, use:
```bash
npx shadcn@latest add [component-name]
```

Configuration uses:
- Style: `new-york`
- Base color: `neutral`
- CSS variables: enabled
- RSC: enabled

### Environment Variables (Planned)

Will need:
- `UPSTASH_SEARCH_REST_URL` / `UPSTASH_SEARCH_REST_TOKEN`
- Auth.js secrets (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
- Neon Postgres connection string
- Resend API key (for transactional emails)

### Error Handling

Follow Next.js App Router patterns:
- Use `error.tsx` for error boundaries
- Use `loading.tsx` for suspense fallbacks
- Validate user input with Zod schemas (not yet added, but planned)

## Critical Don'ts

1. **Never expose Upstash credentials in client components** - all search queries must go through `/api/search`
2. **Don't bypass the `cn()` utility** - always use it for className merging to avoid Tailwind conflicts
3. **Don't modify shadcn/ui base components directly** - extend via composition or variants
4. **Don't use inline styles** - use Tailwind utilities or CSS variables from `globals.css`

## Testing & Validation

- ESLint extends `next/core-web-vitals` and `next/typescript`
- TypeScript strict mode enabled (`tsconfig.json`)
- No test framework currently configured (Jest/Vitest TBD)

## Product Context

See `bridgit-ai-done.md` for full product spec. Key user journey:
1. Sign up (0:30s) - Auth.js with magic links
2. Onboard (1:00s) - Enter URL, watch crawl progress
3. Install (0:30s) - Copy/paste `<script>` snippet

Target: 2-minute onboarding from landing to working search widget on user's site.
