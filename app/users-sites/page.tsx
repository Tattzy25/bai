import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
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
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Users & Sites</h1>
            <p className="text-lg text-muted-foreground">🎯 This is the Users & Sites content area</p>
            <p className="text-sm text-muted-foreground mt-2">Content for user management and site configuration</p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
