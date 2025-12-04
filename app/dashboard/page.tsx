import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { stackApp } from "@/lib/stack"
import { db } from "@/lib/db"
import { sites, analyticsQueryEvents, quotas } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { redirect } from "next/navigation"

export default async function Page() {
  // Authenticate user
  const user = await stackApp.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch user's sites
  const userSites = await db.query.sites.findMany({
    where: eq(sites.userId, user.id),
    with: {
      quota: true,
      searchIndex: true,
    },
    orderBy: [desc(sites.createdAt)],
  })

  // Fetch analytics for all user sites
  const siteIds = userSites.map(s => s.id)
  const analytics = siteIds.length > 0 ? await db.query.analyticsQueryEvents.findMany({
    where: sql`${analyticsQueryEvents.siteId} = ANY(${siteIds})`,
    orderBy: [desc(analyticsQueryEvents.createdAt)],
    limit: 100,
  }) : []

  // Calculate totals
  const totalSearches = analytics.length
  const totalSites = userSites.length
  const activeSites = userSites.filter(s => s.status === 'active').length
  const totalPagesIndexed = userSites.reduce((sum, s) => sum + s.pagesIndexed, 0)

  // Top queries
  const topQueries = analytics.slice(0, 10)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards 
                totalSearches={totalSearches}
                totalSites={totalSites}
                activeSites={activeSites}
                totalPagesIndexed={totalPagesIndexed}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={analytics} />
              </div>
              <DataTable data={topQueries} sites={userSites} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
