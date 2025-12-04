# 🚀 NEXT STEPS - Get Widget Live

Based on the architecture diagram, here's what you need to do RIGHT NOW:

## ✅ What's Already Done
- ✅ Widget code complete (`public/embed.js`)
- ✅ Search API complete (`/api/search`)
- ✅ Crawl API complete (`/api/crawl`)
- ✅ Database schema ready
- ✅ Encryption working

## 🔥 What You Need To Do (In Order)

### Step 1: Get Your Encrypted Upstash Credentials

You said you already have:
- Upstash Search URL
- Upstash Search Token

Run this to encrypt them:

```bash
# Make sure .env.local has your Upstash credentials
tsx scripts/encrypt-upstash-credentials.ts
```

This will output the ENCRYPTED values you need for the SQL.

### Step 2: Update SETUP_TEST_USER.sql

Replace these lines in `SETUP_TEST_USER.sql`:

```sql
INSERT INTO search_indexes (id, siteId, indexName, upstashSearchUrl, upstashSearchToken, createdAt)
VALUES (
  'b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7'::uuid,
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6'::uuid,
  'pk_tattty_main_001',
  'ENCRYPTED_URL_HERE',     -- ⚠️ Replace with encrypted URL from step 1
  'ENCRYPTED_TOKEN_HERE',   -- ⚠️ Replace with encrypted token from step 1
  NOW()
);
```

### Step 3: Run SQL Against Neon Database

```bash
# Copy entire SETUP_TEST_USER.sql and run in Neon SQL Editor
# This creates your user, site, and credentials
```

### Step 4: Trigger Initial Crawl

```bash
# Call the crawl API
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "crawlJobId": "d4e5f6g7-h8i9-40j1-k2l3-m4n5o6p7q8r9"
  }'
```

This will:
- Crawl https://tattty.com
- Extract all page content
- Index into YOUR Upstash Search index
- Update `pagesIndexed` count

### Step 5: Test Widget Locally

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Tattty Search Widget</h1>
  
  <!-- Your widget -->
  <script 
    src="http://localhost:3000/embed.js" 
    data-site-key="pk_tattty_main_001"
    data-endpoint="http://localhost:3000/api/search"
  ></script>
</body>
</html>
```

Open in browser - you should see the floating search button.

### Step 6: Deploy to Production

```bash
cd bai
vercel --prod
```

Then update the widget on tattty.com:

```html
<script 
  src="https://your-domain.vercel.app/embed.js" 
  data-site-key="pk_tattty_main_001"
></script>
```

## 🎯 The Flow (Per Architecture Diagram)

1. **User visits tattty.com** → Sees floating search button
2. **Types query** → Widget calls `/api/search` with `pk_tattty_main_001`
3. **API validates** → Checks referrer is tattty.com, checks quota
4. **Decrypts credentials** → Gets YOUR Upstash URL/token from database
5. **Queries Upstash** → Searches YOUR index for the query
6. **Returns results** → Widget displays them beautifully
7. **Logs analytics** → Tracks in `analytics_query_events` table

## 🔑 Key Points

- **No sign-in needed for widget users** - they just search
- **YOU sign in** (via Neon Auth) to manage sites in dashboard
- **Each customer site gets its own Upstash index** (isolated data)
- **Credentials encrypted in Neon Postgres** (AES-256-GCM)
- **RLS policies protect data** (users only see their own sites)

## ⚠️ Important

The SQL file needs REAL encrypted credentials. Don't skip step 1!

## 📚 Architecture Reference

See `.github/ARCHITECTURE.png` for the complete flow diagram.
