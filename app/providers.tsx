"use client"

import { StackProvider, StackTheme } from "@stackframe/stack"

const stackConfig = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Validate required env vars
  if (!stackConfig.projectId || !stackConfig.publishableClientKey) {
    console.error("Missing Stack Auth environment variables")
    return <>{children}</>
  }

  return (
    <StackProvider app={stackConfig}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  )
}
