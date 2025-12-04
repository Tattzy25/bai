What to build (vision, scope, and definition of done)

Vision: Make Bridgit‑AI the “no‑brainer” way to add fast, typo‑tolerant search to any static site or blog in under 2 minutes. Core promise: “From URL to live search in < 2 minutes.”
Scope (MVP, production‑ready):
Web onboarding flow that provisions a dedicated search index per site, crawls content, and outputs a one‑line embed snippet.
Embeddable JS widget that injects a floating button and search modal, returns instant results, and works on any static site.
Serverless API endpoint that securely queries Upstash Search (no credentials in the browser).
Scheduled re‑crawls via Upstash Workflow; manual “Reindex Now” control.
Basic analytics (top queries, zero‑results, CTR), visible in the dashboard.
Pricing gates (Free/Pro/Business) with quotas and “Powered by Bridgit‑AI” on Free tier.
Definition of Done:
End‑to‑end: A new user can sign up, enter a URL, wait for index to build, paste snippet into a static site, and see working search.
Multi‑tenant isolation: one index per site, secrets never exposed client‑side.
Deployed on Vercel with environment variables configured; monitoring and error handling in place.
No mockups: shipping code, tested flows, and real crawling/searching in production.
Stack and platform choices
Frontend/app: Next.js 14+ (App Router), React, TypeScript, TailwindCSS + shadcn/ui for high‑end UI.
Hosting: Vercel (Edge where applicable).
Auth: Auth.js (NextAuth) with Neon Postgres adapter; email magic links and notifications via Resend.
Database: Neon (serverless Postgres) + Drizzle ORM (HTTP driver for Edge compatibility).
Search: Upstash Search (one index per site).
Crawling/orchestration: Upstash Workflow + @upstash/search-crawler (programmatic mode) with retries and scheduling.
Email: Resend (transactional emails: verify login, crawl finished, quota notices).
Observability: Vercel Analytics, basic request logging; Sentry optional.
User journeys and acceptance criteria (2‑minute flow)
Landing → Sign up (0:00–0:30)
AC:
“Start for Free” CTA leads to sign‑in page (Google OAuth and Email Magic Link).
Successful auth redirects to onboarding page.
Onboarding → First index (0:30–1:30)
AC:
Single input: “What’s your website URL?”
Submit triggers “Create Index + Crawl Job.”
Status view shows: Finding pages → Reading content → Building index → Complete (with progress updates).
On failure, show retriable error with logs link.
Install snippet (1:30–2:00)
AC:
After “Complete,” show a single <script> snippet with Copy button.
Snippet works when pasted into any static site (e.g., Webflow footer, Hugo/Jekyll template).
Default UI: floating icon bottom‑right; clicking opens modal; typing shows instant, relevant results.
Dashboard UX/DX
AC:
Sites list: name, domain, status, last/next crawl, pages indexed.
Buttons: Reindex Now, Copy Snippet, Theme controls (colors, position).
Analytics tab: top queries, zero‑result queries, CTR, latency.
Billing tab: plan info, usage counters, upgrade path.
Data model (Drizzle + Neon)
users
id (uuid pk), email (unique), name, created_at
sites
id (uuid pk), user_id (fk users), name, domain, plan (‘free’ | ‘pro’ | ‘business’), created_at
public_key (short random id in snippet), allowed_referrers (string[]), branding_enabled (bool)
search_indexes
id (uuid pk), site_id (fk sites), upstash_search_url, upstash_search_token (encrypted at rest), created_at
crawl_jobs
id (uuid pk), site_id, status (‘queued’ | ‘running’ | ‘failed’ | ‘complete’), pages_indexed, started_at, finished_at, error_message
analytics_query_events
id (uuid pk), site_id, query, results_count, latency_ms, selected_doc_id nullable, created_at
quotas
id (uuid pk), site_id, period (‘month’), queries_used, pages_crawled, reset_at_
Note: Encrypt tokens at rest; never send Upstash credentials to the browser.

Pages and shadcn/ui components
/ (marketing): Hero, “How it works” (3 steps), pricing tiers, Trust, CTA.
/auth/signin: Auth.js flows (Google, Email).
/app (protected layout w/ sidebar):
/app (Home): “Create your first site” card.
/app/sites: Sites table (shadcn Table), “New Site” Dialog.
/app/sites/[id]:
Overview tab: Status cards (shadcn Cards), next crawl, pages indexed, Reindex Now Button, Copy Snippet Button, Theme controls (shadcn Popover/ColorPicker).
Analytics tab: Charts (Top queries, zero results), table of recent events.
Settings tab: Domain, allowed referrers, plan/usage, delete site.
Global UI: Navbar, User Menu, Command Palette (⌘K) using shadcn Command, Toaster for success/error.
API surface (Next.js route handlers)
POST /api/sites
Body: { name, domain }
Action: create site, create Upstash Search index, persist credentials, enqueue crawl job (Upstash Workflow).
Returns: { siteId, publicKey, snippet }
POST /api/sites/[id]/reindex
Action: enqueue new crawl job for the site
GET /api/search (Edge runtime)
Query: q, siteKey (the site’s public key)
Action: Validate referrer host ∈ allowed_referrers; map siteKey → internal site → upstash index credentials; call Upstash Search; return JSON results; record analytics events
GET /api/analytics/sites/[id]/queries
Return aggregated top queries, zero results, CTR, latency aggregates
POST /api/webhooks/workflow
Verify Upstash Workflow callback; update crawl_jobs + sites status
Core flows (backend)
Provision index:
After site creation, call Upstash Search API to create index for that site.
Store upstash_search_url and upstash_search_token in search_indexes (server‑only).
Crawl + index Upstash Workflow:
Inputs: { domain, indexUrl, indexToken, callbackUrl, siteId }
Steps: Discover pages (sitemap + internal links), fetch content, parse/extract (title, headings, body, url, lastModified, language), upsert in batches to Upstash Search, post status to callbackUrl.
Retries/backoff, concurrency controls, and per‑site page caps enforced by plan.
Search endpoint:
Validate request: referrer domain allowed and siteKey matches a site.
Enforce quotas: queries/month per plan; rate limit per IP if necessary.
Query Upstash Search with field boosts (title > headings > body), typo tolerance, optional filters by metadata.
Log analytics events._
Embeddable widget (pre‑compiled, tiny, no deps)
Packaging:
packages/widget (TypeScript) bundled via tsup to IIFE (global BridgitAI), ESM; include Preact as internal dependency; no external runtime deps.
CDN path: https://cdn.bridgit.ai/widget.js
Snippet to show in dashboard:
<script src="https://cdn.bridgit.ai/widget.js" data-site="PUBLIC_KEY" data-endpoint="https://app.bridgit.ai/api/search" data-position="bottom-right" data-accent="#7c3aed" defer ></script>
Behavior:
On load: inject floating button; on click or keyboard (Cmd/Ctrl+K) open modal.
Debounced fetch to /api/search?q=&siteKey=PUBLIC_KEY
Render results with title, snippet, URL; keyboard navigation; track click (selected_doc_id).
Theming via data-accent; position configurable; Free tier shows subtle “Powered by Bridgit‑AI.”
Pricing and gating (MVP)
Free:
Up to 200 pages; monthly re‑crawl; brand “Powered by Bridgit‑AI.”
Pro ($12/mo):
Up to 2,000 pages; weekly re‑crawl; no branding; manual “Reindex now”; basic analytics.
Business ($49/mo):
Up to 10,000 pages; daily re‑crawl; full customization (colors/position), priority email support.
Enforce caps via quotas table; block new crawl or throttle queries with clear UI upgrade prompts.
Project structure (monorepo friendly)
apps/web (Next.js app)
app/
(marketing pages)
api/
search/route.ts
sites/route.ts
sites/[id]/reindex/route.ts
analytics/sites/[id]/queries/route.ts
webhooks/workflow/route.ts
app/(app) protected routes
components/ui (shadcn)
lib/
db.ts (Neon HTTP driver)
drizzle.ts (Drizzle config)
auth.ts (Auth.js config)
upstash.ts (Search + Workflow clients)
analytics.ts
quotas.ts
security.ts (referrer validation, HMAC utils)
styles/ (tailwind)
packages/widget
src/index.ts (IIFE)
tsup.config.ts
workflows/
crawl-and-index.ts (Upstash Workflow script)
Environment variables (Vercel)
Auth and app
NEXTAUTH_URL
NEXTAUTH_SECRET
RESEND_API_KEY
Database
NEON_DATABASE_URL (serverless Postgres, pooled)
Upstash
UPSTASH_SEARCH_ADMIN_URL
UPSTASH_SEARCH_ADMIN_TOKEN
WORKFLOW_URL / WORKFLOW_TOKEN or per‑workflow secrets
App
APP_BASE_URL=https://app.bridgit.ai
WIDGET_CDN_BASE=https://cdn.bridgit.ai
Note: Store per‑site Upstash credentials in DB; never expose them to the client.

Code scaffolds (key files)
Drizzle config and schema (lib/drizzle.ts)
ts


// lib/drizzle.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.NEON_DATABASE_URL!);
export const db = drizzle(sql, { schema });
ts


// lib/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow()
});

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  plan: text('plan').notNull().default('free'),
  publicKey: text('public_key').notNull(),
  allowedReferrers: jsonb('allowed_referrers').$type<string[]>().default(['*']),
  brandingEnabled: boolean('branding_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const searchIndexes = pgTable('search_indexes', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull(),
  upstashUrl: text('upstash_url').notNull(),
  upstashToken: text('upstash_token').notNull(), // encrypt at rest
  createdAt: timestamp('created_at').defaultNow()
});

export const crawlJobs = pgTable('crawl_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull(),
  status: text('status').notNull().default('queued'),
  pagesIndexed: integer('pages_indexed').default(0),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  errorMessage: text('error_message')
});

export const analyticsQueryEvents = pgTable('analytics_query_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull(),
  query: text('query').notNull(),
  resultsCount: integer('results_count').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  selectedDocId: text('selected_doc_id'),
  createdAt: timestamp('created_at').defaultNow()
});

export const quotas = pgTable('quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull(),
  period: text('period').notNull().default('month'),
  queriesUsed: integer('queries_used').notNull().default(0),
  pagesCrawled: integer('pages_crawled').notNull().default(0),
  resetAt: timestamp('reset_at').notNull()
});
Create site and start crawl (app/api/sites/route.ts)
ts


import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sites, searchIndexes, quotas } from '@/lib/schema';
import { randomBytes } from 'node:crypto';
import { createUpstashIndex, startWorkflow } from '@/lib/upstash';

export async function POST(req: Request) {
  const { name, domain } = await req.json();
  // Auth: derive userId from session (omitted for brevity)
  const userId = '...';

  const publicKey = randomBytes(9).toString('base64url');
  // 1) Create site
  const [site] = await db.insert(sites).values({
    userId, name, domain, publicKey, allowedReferrers: [domain], plan: 'free'
  }).returning();

  // 2) Create Upstash Search index (one per site)
  const { url: upstashUrl, token: upstashToken } = await createUpstashIndex({ siteId: site.id, domain });

  await db.insert(searchIndexes).values({
    siteId: site.id, upstashUrl, upstashToken /* encrypt before storing */
  });

  // 3) Initialize quota window
  await db.insert(quotas).values({
    siteId: site.id, period: 'month', queriesUsed: 0, pagesCrawled: 0, resetAt: nextMonth()
  });

  // 4) Start crawl via Upstash Workflow
  await startWorkflow({
    domain,
    siteId: site.id,
    indexUrl: upstashUrl,
    indexToken: upstashToken,
    callbackUrl: `${process.env.APP_BASE_URL}/api/webhooks/workflow`
  });

  const snippet = `<script src="${process.env.WIDGET_CDN_BASE}/widget.js" data-site="${site.publicKey}" data-endpoint="${process.env.APP_BASE_URL}/api/search" defer></script>`;
  return NextResponse.json({ siteId: site.id, publicKey: site.publicKey, snippet });
}

function nextMonth() {
  const d = new Date(); d.setUTCMonth(d.getUTCMonth() + 1); return d;
}
Search endpoint (Edge) (app/api/search/route.ts)
ts


export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sites, searchIndexes, analyticsQueryEvents } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { validateReferrer } from '@/lib/security';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const siteKey = searchParams.get('siteKey') || '';
  if (!q || !siteKey) return NextResponse.json({ error: 'Missing q/siteKey' }, { status: 400 });

  const ref = req.headers.get('referer') || '';
  const site = await db.query.sites.findFirst({ where: (s, { eq }) => eq(s.publicKey, siteKey) });
  if (!site || !validateReferrer(ref, site.allowedReferrers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idx = await db.query.searchIndexes.findFirst({ where: (i, { eq }) => eq(i.siteId, site.id) });
  if (!idx) return NextResponse.json({ error: 'Index missing' }, { status: 500 });

  const start = Date.now();
  // Query Upstash Search
  const res = await fetch(`${idx.upstashUrl}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idx.upstashToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: q,
      limit: 10,
      // example boosts: title > headings > body
      ranking: { boosts: { title: 3, headings: 2, body: 1 }, typoTolerance: true }
    })
  });
  if (!res.ok) return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  const data = await res.json();
  const latencyMs = Date.now() - start;

  // Fire‑and‑forget analytics (best‑effort)
  // In Edge, you can use waitUntil if in a runtime that supports it; else ignore errors
  db.insert(analyticsQueryEvents).values({
    siteId: site.id,
    query: q,
    resultsCount: (data?.hits?.length ?? 0),
    latencyMs
  }).catch(() => {});

  return NextResponse.json({ hits: data.hits ?? [] });
}
Upstash Workflow (workflows/crawl-and-index.ts)
ts


// Pseudocode-esque (final impl per Upstash Workflow runtime)
// Inputs: { domain, siteId, indexUrl, indexToken, callbackUrl }
import { crawl } from '@upstash/search-crawler';

export default async function run(payload: any) {
  const { domain, indexUrl, indexToken, callbackUrl, siteId } = payload;
  const results: any[] = [];

  await crawl({
    startUrl: `https://${domain}`,
    respectRobotsTxt: true,
    maxPages: planCapFor(siteId), // e.g., 200/2000/10000
    onPage: async (page) => {
      const { url, title, headings, content, lastModified, lang } = extractContent(page.html, page.url);
      results.push({
        id: url,
        title,
        headings,
        body: content,
        metadata: { url, lastModified, lang }
      });
      if (results.length >= 100) {
        await upsertBatch(indexUrl, indexToken, results.splice(0));
      }
    },
    onError: async (err, url) => {
      // log
    },
    rateLimit: { rpm: 60 }, // adjust safely
    retries: 3
  });

  if (results.length) await upsertBatch(indexUrl, indexToken, results);

  await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId, status: 'complete', pagesIndexed: 'computed' })
  });
}

async function upsertBatch(indexUrl: string, token: string, docs: any[]) {
  await fetch(`${indexUrl}/upsert/batch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents: docs })
  });
}

function extractContent(html: string, url: string) {
  // Strip nav/footers/ads, keep title, H1–H3, main article; return { title, headings, content, lastModified, lang }
  // Implementation detail omitted; use a robust parser
  return { url, title: '', headings: [], content: '', lastModified: null, lang: 'en' };
}

function planCapFor(siteId: string) {
  // Lookup site plan and return maxPages per plan
  return 200;
}
Widget bundle (packages/widget/src/index.ts)
ts


// IIFE global `BridgitAI`; minimal Preact-based modal + search
(() => {
  const d = document;
  const script = d.currentScript as HTMLScriptElement;
  const siteKey = script?.dataset?.site || '';
  const endpoint = script?.dataset?.endpoint || '/api/search';
  const accent = script?.dataset?.accent || '#7c3aed';
  const position = script?.dataset?.position || 'bottom-right';

  if (!siteKey) return;

  // Inject styles and container
  const style = d.createElement('style');
  style.textContent = `/* minimal styles, CSS variables for accent */ :root{--ba-accent:${accent}} /* … */`;
  d.head.appendChild(style);

  const btn = d.createElement('button');
  btn.setAttribute('aria-label', 'Search');
  btn.style.position = 'fixed';
  // position mapping ...
  d.body.appendChild(btn);

  const modal = d.createElement('div');
  modal.innerHTML = `
    <div class="ba-backdrop"></div>
    <div class="ba-modal">
      <input class="ba-input" placeholder="Search…" autofocus />
      <div class="ba-results"></div>
      <div class="ba-footer">${poweredBy()}</div>
    </div>`;
  d.body.appendChild(modal);

  function poweredBy() {
    // Optionally hide when plan allows; default show
    return `<span>Powered by Bridgit‑AI</span>`;
  }

  const input = modal.querySelector('.ba-input') as HTMLInputElement;
  const results = modal.querySelector('.ba-results') as HTMLElement;

  let t: any;
  input?.addEventListener('input', () => {
    clearTimeout(t);
    const q = input.value.trim();
    if (!q) { results.innerHTML = ''; return; }
    t = setTimeout(async () => {
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}&siteKey=${siteKey}`, { method: 'GET' });
      const data = await res.json();
      renderResults(data?.hits || []);
    }, 120);
  });

  function renderResults(hits: any[]) {
    results.innerHTML = hits.map((h: any) => `
      <a class="ba-hit" href="${h.metadata?.url || '#'}">
        <div class="ba-title">${escape(h.title || h.metadata?.url || '')}</div>
        <div class="ba-snippet">${escape(h.body?.slice(0, 140) || '')}</div>
      </a>`).join('');
  }

  function escape(s: string) { return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!)); }

  btn.addEventListener('click', () => open());
  d.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });

  function open() { modal.classList.add('open'); input?.focus(); }
  function close() { modal.classList.remove('open'); }
})();
Security and compliance
No Upstash tokens in browser; all search calls go through server (Edge) with server‑side credentials.
Validate referrer or origin against allowed_referrers per site; block otherwise.
Rate limiting: add IP‑based throttle per site (simple in‑memory token bucket on Edge or Upstash Redis if needed).
Respect robots.txt during crawl; allow per‑path excludes in site settings.
Encrypt sensitive values at rest in DB; rotate Upstash tokens if compromised.
CSP headers on dashboard; sanitize/escape all user content in widget rendering._
Scheduling and re‑crawls
Use Upstash Workflow scheduler to run per plan frequency (monthly/weekly/daily).
“Reindex Now” triggers immediate run if within plan quota.
Implement idempotent upserts keyed by canonical URL; support incremental fetch using ETag/Last‑Modified where possible.
Analytics and DX
Events captured on each query: query string, latency, results count, selected doc id (when clicked).
Dashboard charts:
Top queries (count).
Zero‑results queries (top 20).
CTR by page (selected_doc_id frequency).
Developer affordances:
Copy snippet, theme color picker, position selector.
Inline logs for last crawl (last 50 lines).
“Test search” in dashboard powered by same /api/search.
Emails (Resend)
Magic link sign‑in emails.
“Index complete” with pages indexed count and snippet.
Quota/plan limit notifications (approaching cap, recrawl blocked).
“Reindex complete” with summary.
CI/CD and monitoring
Vercel preview deploys on PRs; production on main.
Health checks on /api/search (no auth, returns 200 with minimal payload).
Error logging: Vercel functions logs; add Sentry later if needed.
Backup strategy: Neon point‑in‑time recovery; routine export of tables (users, sites, quotas).
Theming and customization (Business plan)
Data attributes on snippet allow color and position tweaks.
Dashboard toggles for:
Accent color, dark/light auto.
Modal size and corner radius.
Button shape (round/pill), icon options.
Pricing enforcement (middleware logic)
On search:
Check queries_used vs plan cap; if exceeded, return 402 payload with upgrade suggestion (widget shows friendly “Daily limit reached”).
On crawl:
Cap max pages; stop when threshold reached; log “truncated by plan.”_
Testing
Unit tests: content extraction, referrer validation, quota math.
Integration:
Register → Create site → Crawl job → Webhook completion → Copy snippet.
Widget loads and searches a known static test site.
E2E: Playwright hitting a deployed static sample on Vercel + injected snippet.
Setup steps (Dev → Prod)
Bootstrap Next.js app with Tailwind + shadcn/ui; generate core components (Button, Dialog, Command, Table, Tabs, Card, Popover, Toaster).
Wire Auth.js (Google OAuth + Email via Resend).
Configure Neon DB; run Drizzle migrations; verify connection on Edge and Node runtimes.
Implement /api/sites (provision site + Upstash index) and /api/search (Edge).
Implement Upstash Workflow script and webhook endpoint; verify crawl on a real domain.
Build widget package with tsup; publish to Vercel static assets as CDN path; confirm snippet works on a sample static site.
Build dashboard: Sites list, Site detail (Overview/Analytics/Settings), Copy Snippet, Reindex.
Add quotas and simple pricing gates; show upgrade prompts.
Add Resend emails for magic link and crawl completion.
Deploy to Vercel; configure env vars; test full 2‑minute flow.
Copy blocks (for marketing and onboarding)
Headline: Bridgit‑AI — Instant, typo‑tolerant search for any static site
Subhead: Go from URL to live, beautiful search in under 2 minutes. No servers. No configs. Just paste a snippet.
Primary CTA: Start for free
Steps:
Enter your site URL
We crawl and index
Paste the snippet
Proof points: Blazing fast, serverless, accessible UI, works with Webflow, Hugo, Jekyll, Ghost, Squarespace, and more.
Free tier note: Includes subtle “Powered by Bridgit‑AI.”
Summary
This prompt specifies the complete, production‑ready MVP for Bridgit‑AI: a serverless, multi‑tenant, instant search widget for static sites with a 2‑minute onboarding experience. It includes UI/UX with shadcn/ui, robust DX, secure search via Edge endpoint, durable crawling and scheduling with Upstash Workflow, Neon Postgres for state and analytics, and a tiny embeddable widget. The deliverable is ready to deploy on Vercel and validate with real customers.

https://www.mermaidchart.com/d/77ba46e0-7dfd-4ed8-af9a-2d65d548abb6