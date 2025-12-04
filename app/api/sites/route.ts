import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sites, searchIndexes, quotas, crawlJobs } from '@/lib/db/schema'
import { stackApp } from '@/lib/stack'
import { encrypt, generatePublicKey } from '@/lib/crypto.server'
import { Search } from '@upstash/search'

const createSiteSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().url(),
  plan: z.enum(['free', 'pro', 'business']).default('free'),
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user with Stack Auth
    const user = await stackApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, domain, plan } = createSiteSchema.parse(body)

    // Generate unique public key for embed snippet
    const publicKey = generatePublicKey()

    // Extract domain for allowed referrers
    const domainUrl = new URL(domain)
    const allowedReferrers = [
      domainUrl.origin,
      'https://bridgit-ai.com',
      'https://www.bridgit-ai.com',
      'https://bai-chi.vercel.app',
    ]

    const indexName = `site_${publicKey}`
    
    // Note: Upstash Search SDK doesn't expose index creation directly
    // We'll use the index on-demand - it gets created on first write
    // For production, you'd call their REST API to pre-create the index

    // Store encrypted credentials
    const upstashUrl = process.env.UPSTASH_SEARCH_REST_URL!
    const upstashToken = process.env.UPSTASH_SEARCH_REST_TOKEN!

    // Create site record
    const [site] = await db.insert(sites).values({
      userId: user.id,
      name,
      domain,
      plan,
      publicKey,
      allowedReferrers,
      status: 'pending',
    }).returning()

    // Create search index record
    await db.insert(searchIndexes).values({
      siteId: site.id,
      indexName,
      upstashSearchUrl: encrypt(upstashUrl),
      upstashSearchToken: encrypt(upstashToken),
    })

    // Create quota record
    const now = new Date()
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1) // First day of next month
    
    await db.insert(quotas).values({
      siteId: site.id,
      period: 'month',
      queriesUsed: 0,
      pagesCrawled: 0,
      resetAt,
    })

    // Create initial crawl job
    const [crawlJob] = await db.insert(crawlJobs).values({
      siteId: site.id,
      status: 'queued',
    }).returning()

    // TODO: Enqueue Upstash Workflow crawl job here
    // Will implement in next step with crawl workflow

    // Generate embed snippet
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://bridgit-ai.com'
    const embedSnippet = `<script src="${base}/embed.js" data-site-key="${publicKey}"></script>`

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        publicKey: site.publicKey,
        status: site.status,
      },
      embedSnippet,
      crawlJobId: crawlJob.id,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Error creating site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await stackApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all sites for this user
    const userSites = await db.query.sites.findMany({
      where: (sites, { eq }) => eq(sites.userId, user.id),
      with: {
        quota: true,
      },
      orderBy: (sites, { desc }) => [desc(sites.createdAt)],
    })

    return NextResponse.json({ sites: userSites })

  } catch (error) {
    console.error('Error fetching sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
