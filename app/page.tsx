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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalSearches: number
  totalSites: number
  activeSites: number
  totalPagesIndexed: number
  dailyStats: Array<{ date: string; searches: number }>
  topQueries: Array<{ query: string; searches: number }>
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    totalSites: 0,
    activeSites: 0,
    totalPagesIndexed: 0,
    dailyStats: [],
    topQueries: [],
  })
  const [sitesTableData, setSitesTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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
                <ChartAreaInteractive data={stats.dailyStats} />
              </div>
              
              {/* Top Queries Card */}
              {stats.topQueries.length > 0 && (
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Search Queries</CardTitle>
                      <CardDescription>Most popular searches across all your sites</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.topQueries.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">{item.query}</span>
                            <span className="text-sm text-muted-foreground">{item.searches} searches</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <DataTable data={sitesTableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}