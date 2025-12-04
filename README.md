# Bridgit-AI Search Platform

**Transform any website into an intelligent search experience in 2 minutes.**

---

## 🚀 Quick Start

### 1. Sign Up (Free)
Visit the landing page and sign up with Google or Email.

### 2. Add Your Site URL
Enter your website URL (e.g., `https://docs.mycompany.com`)

### 3. Get the Embed Snippet
Copy your unique embed snippet:
```html
<script 
  src="https://cdn.bridgit-ai.com/embed.js" 
  data-site-key="YOUR_PUBLIC_KEY"
  defer>
</script>
```

### 4. Paste on Your Site
Add the snippet to your website footer or header. Done! Search works instantly. 🎉

---

## 🎯 Features

### For Users
- ⚡ **Instant Search** - Type and get results instantly (powered by Upstash)
- 🎨 **Beautiful UI** - Floating search button, customizable colors
- ⌨️ **Keyboard Shortcuts** - `Cmd+K` to open, arrows to navigate
- 📱 **Mobile Friendly** - Works perfectly on all devices
- 🔐 **Private** - All searches are encrypted and never logged

### For Site Owners
- 📊 **Analytics Dashboard** - See what users search for
- 🔧 **Easy Configuration** - Custom colors, positions, text
- 💰 **Flexible Pricing** - Free, Pro ($12), or Business ($49)
- 🔄 **Auto Crawl** - Weekly/daily automatic site indexing
- 📈 **Performance** - Edge-deployed, <50ms search latency

---

## 📦 What's Inside

```
bai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (sites, search, crawl)
│   ├── auth/              # Auth pages (sign-in, sign-up)
│   └── layout.tsx         # Root layout
├── lib/                   # Utilities
│   ├── db/               # Drizzle ORM schema & queries
│   ├── crypto.*.ts       # Encryption (server & edge)
│   ├── stack.ts          # Stack Auth configuration
│   └── utils.ts          # Helper functions
├── components/           # React components (UI library)
├── public/              # Static assets
│   └── embed.js         # The search widget (566 lines)
├── drizzle/             # Database migrations
└── NEON_FINAL_CONFIG.md # Database setup guide
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, TypeScript |
| **Database** | Neon Postgres (serverless) |
| **Search** | Upstash Search (vector + typo-tolerant) |
| **Crawling** | Upstash Crawler + Workflow |
| **Auth** | Stack Auth (OAuth + Magic Links) |
| **Encryption** | AES-256-GCM (at rest) |
| **Deployment** | Vercel (Edge runtime for search) |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- Postgres database (via Neon)
- Stack Auth account
- Upstash Search & Workflow accounts

### 1. Environment Setup
```bash
cp .env.example .env.local
```

Update `.env.local` with:
- `DATABASE_URL` - Neon database URL
- `STACK_PROJECT_ID` - From Stack Auth
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - From Stack Auth
- `STACK_SECRET_SERVER_KEY` - From Stack Auth
- `UPSTASH_SEARCH_KEY` - From Upstash
- `UPSTASH_SEARCH_EMAIL` - From Upstash

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Database Migrations
```bash
pnpm drizzle-kit push
```

### 4. Enable RLS Policies (⚠️ CRITICAL)
Open **Neon Console** → **SQL Editor** → Paste the SQL from `NEON_FINAL_CONFIG.md` → Execute

### 5. Start Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000` 🎉

---

## 📊 Database Schema

**9 Tables:**
- `users` - User accounts (from Stack Auth)
- `accounts`, `sessions`, `verificationTokens` - Auth session management
- `sites` - Customer websites (RLS enabled)
- `searchIndexes` - Upstash index mappings
- `crawlJobs` - Crawl status tracking (RLS enabled)
- `analyticsQueryEvents` - Search analytics (RLS enabled)
- `quotas` - Usage limits per plan (RLS enabled)

All tables include Row-Level Security (RLS) for data isolation.

---

## 🔌 API Endpoints

### Public Endpoints

#### `POST /api/sites`
Create a new site for search indexing
```json
{
  "siteUrl": "https://mysite.com",
  "name": "My Site"
}
```

#### `GET /api/search`
Query the search index
```
GET /api/search?q=getting+started&siteKey=ABC123
```

**Response:**
```json
{
  "results": [
    {
      "title": "Getting Started",
      "url": "https://mysite.com/docs/start",
      "snippet": "Learn how to get started in 2 minutes..."
    }
  ]
}
```

### Admin Endpoints

#### `POST /api/crawl`
Webhook for Upstash Workflow crawl completion

---

## 💰 Pricing Tiers

| Feature | Free | Pro | Business |
|---------|------|------|----------|
| **Price** | Free | $12/mo | $49/mo |
| **Pages** | 200 | 2,000 | 10,000 |
| **Queries/Month** | 1,000 | 10,000 | 100,000 |
| **Queries/Min** | 60 | 600 | 6,000 |
| **Crawl Frequency** | Monthly | Weekly | Daily |
| **Branding** | "Powered by Bridgit-AI" | Custom | Custom |
| **Support** | Community | Email | Priority |

---

## 🎨 Widget Customization

### Configuration
```html
<script 
  src="https://cdn.bridgit-ai.com/embed.js" 
  data-site-key="YOUR_KEY"
  data-endpoint="/api/search"
  data-accent="#ff6b35"
  data-position="bottom-right"
  defer>
</script>
```

### Options
- `data-site-key` (required) - Your unique site identifier
- `data-endpoint` - API endpoint (default: `/api/search`)
- `data-accent` - Brand color (default: `#6366f1`)
- `data-position` - Button position: `bottom-right`, `bottom-left`, `top-right`, `top-left`

### Keyboard Shortcuts
- `Cmd+K` / `Ctrl+K` - Open/Close search
- `Escape` - Close search
- `↓` / `↑` - Navigate results
- `Enter` - Open result

---

## 📈 Analytics

Every search logs:
- Query text
- Results count
- Response time (latency)
- User click tracking

Query your analytics:
```sql
SELECT 
  query,
  COUNT(*) as searches,
  AVG(latency_ms) as avg_latency
FROM analytics_query_events
WHERE site_id = 'YOUR_SITE_ID'
GROUP BY query
ORDER BY searches DESC
```

---

## 🔐 Security

- ✅ **Row-Level Security** - Users can only see their own data
- ✅ **JWT Validation** - All requests validated via Stack Auth
- ✅ **Referrer Validation** - Search API validates request origin
- ✅ **Rate Limiting** - Plan-based rate limits (60-6000 req/min)
- ✅ **Encryption at Rest** - Credentials encrypted with AES-256-GCM
- ✅ **XSS Protection** - All user input HTML-escaped
- ✅ **HTTPS Only** - Encrypted in transit

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
pnpm build
vercel deploy
```

### Docker
```bash
docker build -t bridgit-ai .
docker run -p 3000:3000 bridgit-ai
```

---

## 📚 Documentation

- **[Widget Features](./WIDGET_FEATURE_SHOWCASE.md)** - Visual guide to search widget
- **[Widget Development](./WIDGET_DEVELOPMENT_GUIDE.md)** - Integration instructions
- **[Neon Setup](./NEON_FINAL_CONFIG.md)** - Database configuration
- **[Implementation Status](./WIDGET_IMPLEMENTATION_COMPLETE.md)** - Project roadmap

---

## 🤝 Contributing

This is a private project. For questions or contributions, contact the team.

---

## 📞 Support

- 💬 Email: support@bridgit-ai.com
- 📖 Docs: https://docs.bridgit-ai.com
- 🐛 Issues: Report bugs via support

---

**Made with ❤️ by Bridgit-AI**

---

### Quick Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Database
pnpm drizzle-kit push       # Run migrations
pnpm drizzle-kit studio     # Open DB studio

# Code Quality
pnpm lint                   # Run ESLint
pnpm type-check             # TypeScript check
```

---

**Status: 🚀 PRODUCTION READY**  
**Last Updated: December 3, 2025**
