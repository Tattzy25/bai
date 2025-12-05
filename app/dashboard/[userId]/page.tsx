"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/user-sidebar"
import { UserWelcome } from "@/components/user-dashboard-sections/welcome"
import { MyDashboard } from "@/components/user-dashboard-sections/my-dashboard"
import { SearchDesigns } from "@/components/user-dashboard-sections/search-designs"
import { CustomizeSearch } from "@/components/user-dashboard-sections/customize-search"
import { DataAnalytics } from "@/components/user-dashboard-sections/data-analytics"
import { Settings } from "@/components/user-dashboard-sections/settings"

type UserDashboardStats = {
  totalSearches: number
  totalSites: number
  activeSites: number
  totalPagesIndexed: number
}

export default function UserDashboardPage() {
  const params = useParams()
  const userId = params.userId as string
  const [activeSection, setActiveSection] = useState("welcome")

  const [stats, setStats] = useState<UserDashboardStats>({
    totalSearches: 0,
    totalSites: 1,
    activeSites: 1,
    totalPagesIndexed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/dashboard/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to load user dashboard:', error)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case "welcome":
        return <UserWelcome />
      case "my-dashboard":
        return <MyDashboard stats={stats} />
      case "search-designs":
        return <SearchDesigns />
      case "customize":
        return <CustomizeSearch />
      case "analytics":
        return <DataAnalytics />
      case "settings":
        return <Settings />
      default:
        return <UserWelcome />
    }
  }

  return (
    <SidebarProvider>
      <UserSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <div className="flex flex-1 flex-col min-h-screen bg-background">
          <div className="flex-1 overflow-auto">
            <div className="p-6 max-w-7xl mx-auto">
              {renderSection()}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
