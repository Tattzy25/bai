import { NextRequest, NextResponse } from 'next/server'
import { Search } from '@upstash/search'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/crypto.edge'
import { sites, analyticsQueryEvents, quotas } from '@/lib/db/schema'
import { eq, gte, and } from 'drizzle-orm'

export const runtime = 'edge'

const PLAN_LIMITS = {
  free: 1000,
  pro: 10000,
  business: 100000,
}

// Per-minute rate limits by plan
const RATE_LIMITS_PER_MINUTE = {
  free: 60,
  pro: 600,
  business: 6000,
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const siteKey = searchParams.get('siteKey')

    if (!query || !siteKey) {
      return NextResponse.json({ error: 'Missing query or siteKey' }, { status: 400 })
    }

    // Get referrer for validation
    const referrer = req.headers.get('referer') || req.headers.get('origin')
    
    // Lookup site by public key
    const site = await db.query.sites.findFirst({
      where: eq(sites.publicKey, siteKey),
      with: {
        searchIndex: true,
        quota: true,
      },
    })

    if (!site) {
      return NextResponse.json({ error: 'Invalid siteKey' }, { status: 404 })
    }

    // Validate referrer against allowed domains
    if (referrer) {
      const referrerUrl = new URL(referrer)
      const referrerOrigin = referrerUrl.origin
      
      if (!site.allowedReferrers.includes(referrerOrigin)) {
        return NextResponse.json({ 
          error: 'Referrer not allowed',
          referrer: referrerOrigin,
          allowed: site.allowedReferrers,
        }, { status: 403 })
      }
    }

    // Check quota limits
    const planLimit = PLAN_LIMITS[site.plan as keyof typeof PLAN_LIMITS]
    if (site.quota && site.quota.queriesUsed >= planLimit) {
      return NextResponse.json({ 
        error: 'Query quota exceeded',
        plan: site.plan,
        limit: planLimit,
      }, { status: 429 })
    }

    // Per-minute rate limiting based on analytics events in the last 60s
    const windowStart = new Date(Date.now() - 60 * 1000)
    const recentCountResult = await db.select({ count: analyticsQueryEvents.id })
      .from(analyticsQueryEvents)
      .where(and(
        eq(analyticsQueryEvents.siteId, site.id),
        gte(analyticsQueryEvents.createdAt, windowStart)
      ))

    const recentCount = Array.isArray(recentCountResult) && recentCountResult[0]?.count ? Number(recentCountResult[0].count) : 0
    const perMinuteLimit = RATE_LIMITS_PER_MINUTE[site.plan as keyof typeof RATE_LIMITS_PER_MINUTE]
    if (recentCount >= perMinuteLimit) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        window: '1m',
        limit: perMinuteLimit,
      }, { status: 429 })
    }

    // Decrypt Upstash credentials
    if (!site.searchIndex) {
      return NextResponse.json({ error: 'Search index not configured' }, { status: 500 })
    }

    const upstashUrl = await decrypt(site.searchIndex.upstashSearchUrl)
    const upstashToken = await decrypt(site.searchIndex.upstashSearchToken)

    // Query Upstash Search
    const searchClient = new Search({
      url: upstashUrl,
      token: upstashToken,
    })

    const index = searchClient.index(site.searchIndex.indexName)
    
    const results = await index.search({
      query,
      limit: 10,
      reranking: true,
    })

    const latencyMs = Date.now() - startTime

    // Log analytics (fire and forget)
    db.insert(analyticsQueryEvents).values({
      siteId: site.id,
      query,
      resultsCount: ((results as any).data || []).length,
      latencyMs,
    }).catch(err => console.error('Failed to log analytics:', err))

    // Increment query usage (fire and forget)
    if (site.quota) {
      db.update(quotas)
        .set({ queriesUsed: site.quota.queriesUsed + 1 })
        .where(eq(quotas.id, site.quota.id))
        .catch(err => console.error('Failed to update quota:', err))
    }

    // Return results with branding if Free plan
    return NextResponse.json({
      results: (results as any).data || [],
      latencyMs,
      ...(site.brandingEnabled && { poweredBy: 'Bridgit-AI' }),
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ 
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
