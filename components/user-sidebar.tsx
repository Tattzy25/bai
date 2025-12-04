"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Home,
  Sparkles,
  Palette,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type MenuItem = {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
}

const menuItems: MenuItem[] = [
  {
    id: "welcome",
    label: "Welcome",
    icon: <Home className="h-4 w-4" />,
  },
  {
    id: "my-dashboard",
    label: "My Dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "search-designs",
    label: "Search Designs",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: "customize",
    label: "Customize Search",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: "analytics",
    label: "Data & Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
]

interface UserSidebarProps {
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export function UserSidebar({ activeSection, onSectionChange }: UserSidebarProps) {
  const params = useParams()
  const userId = params.userId as string

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            B
          </div>
          <span className="font-semibold">Bridgit AI</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Your Search Dashboard</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onSectionChange(item.id)}
                isActive={activeSection === item.id}
                className={activeSection === item.id ? "bg-accent" : ""}
              >
                {item.icon}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <div className="border-t p-4 space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </Sidebar>
  )
}
