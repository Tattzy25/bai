import { NextRequest, NextResponse } from 'next/server'
import { crawlAndIndex } from '@upstash/search-crawler'
import { db } from '@/lib/db'
import { sites, crawlJobs, quotas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { decrypt } from '@/lib/crypto.server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { siteId, crawlJobId } = body

    // Get site and search index
    const site = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
      with: {
        searchIndex: true,
        quota: true,
      },
    })

    if (!site || !site.searchIndex) {
      return NextResponse.json({ error: 'Site or index not found' }, { status: 404 })
    }

    // Simple plan-based throttle: prevent crawls if nextCrawlAt is in the future
    const now = new Date()
    if (site.nextCrawlAt && site.nextCrawlAt > now) {
      return NextResponse.json({
        error: 'Crawl throttled',
        nextAllowedAt: site.nextCrawlAt,
      }, { status: 429 })
    }

    // Update crawl job status to running
    await db.update(crawlJobs)
      .set({ 
        status: 'running',
        startedAt: new Date(),
      })
      .where(eq(crawlJobs.id, crawlJobId))

    // Decrypt credentials
    const upstashUrl = decrypt(site.searchIndex.upstashSearchUrl)
    const upstashToken = decrypt(site.searchIndex.upstashSearchToken)

    // Run crawler
    try {
      const result = await crawlAndIndex({
        upstashUrl,
        upstashToken,
        indexName: site.searchIndex.indexName,
        docUrl: site.domain,
        silent: true,
      })

      // Update site and crawl job
      await db.update(sites)
        .set({
          status: 'active',
          lastCrawlAt: new Date(),
             pagesIndexed: result.newRecordsCount || 0,
             // Set nextCrawlAt based on plan throttle window
             nextCrawlAt: (() => {
               const throttleMinutes = site.plan === 'business' ? 2 : site.plan === 'pro' ? 10 : 30
               return new Date(Date.now() + throttleMinutes * 60 * 1000)
             })(),
        })
        .where(eq(sites.id, siteId))

      await db.update(crawlJobs)
        .set({
          status: 'complete',
          finishedAt: new Date(),
             pagesIndexed: result.newRecordsCount || 0,
        })
        .where(eq(crawlJobs.id, crawlJobId))

      // Increment pages crawled in quota (fire and forget)
      if (site.quota) {
        db.update(quotas)
          .set({ pagesCrawled: site.quota.pagesCrawled + (result.newRecordsCount || 0) })
          .where(eq(quotas.id, site.quota.id))
          .catch(err => console.error('Failed to update pages crawled quota:', err))
      }

      return NextResponse.json({ 
        success: true, 
           indexedCount: result.newRecordsCount || 0,
      })

    } catch (crawlError) {
      // Update crawl job as failed
      await db.update(crawlJobs)
        .set({
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: crawlError instanceof Error ? crawlError.message : 'Unknown error',
        })
        .where(eq(crawlJobs.id, crawlJobId))

      await db.update(sites)
        .set({ status: 'failed' })
        .where(eq(sites.id, siteId))

      throw crawlError
    }

  } catch (error) {
    console.error('Crawl workflow error:', error)
    return NextResponse.json({ 
      error: 'Crawl failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
