"use client"

import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

type MyDashboardProps = {
  stats: {
    totalSearches: number
    totalSites: number
    activeSites: number
    totalPagesIndexed: number
  }
}

export function MyDashboard({ stats }: MyDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Your search performance at a glance</p>
      </div>

      <SectionCards 
        totalSearches={stats.totalSearches}
        totalSites={stats.totalSites}
        activeSites={stats.activeSites}
        totalPagesIndexed={stats.totalPagesIndexed}
      />

      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}
