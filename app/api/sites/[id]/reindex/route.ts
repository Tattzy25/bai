import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sites, crawlJobs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Neon Auth JWT validation and RLS filtering happens at database level
    // No manual user authentication needed - RLS policies enforce access

    // Verify site ownership via RLS
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, id),
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // RLS policy automatically ensures user can only access their own sites
    // If query returns a result, the current user owns it

    // Throttle: prevent reindex if nextCrawlAt is in the future
    const now = new Date()
    if (site.nextCrawlAt && site.nextCrawlAt > now) {
      return NextResponse.json({
        error: 'Crawl throttled',
        nextAllowedAt: site.nextCrawlAt,
      }, { status: 429 })
    }

    // Create new crawl job
    const [crawlJob] = await db.insert(crawlJobs).values({
      siteId: site.id,
      status: 'queued',
    }).returning()

    // TODO: Enqueue Upstash Workflow
    // For now, returning the job ID

    return NextResponse.json({
      crawlJobId: crawlJob.id,
      status: 'queued',
    })

  } catch (error) {
    console.error('Error triggering reindex:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
