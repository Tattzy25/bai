"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

export default function Page() {
  const [stats, setStats] = useState({
    totalSearches: 0,
    totalSites: 0,
    activeSites: 0,
    totalPagesIndexed: 0,
  })
  const [sitesTableData, setSitesTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch from API route
    // For now, using empty data
    setStats({
      totalSearches: 0,
      totalSites: 0,
      activeSites: 0,
      totalPagesIndexed: 0,
    })
    setSitesTableData([])
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

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
                totalSearches={stats.totalSearches}
                totalSites={stats.totalSites}
                activeSites={stats.activeSites}
                totalPagesIndexed={stats.totalPagesIndexed}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={sitesTableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
