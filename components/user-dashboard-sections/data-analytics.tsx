"use client"

import { DataTable } from "@/components/data-table"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

export function DataAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Data & Analytics</h1>
        <p className="text-muted-foreground">Detailed insights about your search usage</p>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Search Trends</h2>
        <ChartAreaInteractive />
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Searches</h2>
        <DataTable data={[]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Top Search Query</p>
          <p className="text-2xl font-bold">documentation</p>
          <p className="text-xs text-muted-foreground mt-1">245 searches this month</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Avg Click-Through Rate</p>
          <p className="text-2xl font-bold">87%</p>
          <p className="text-xs text-muted-foreground mt-1">+5% from last month</p>
        </div>
      </div>
    </div>
  )
}
