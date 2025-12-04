"use client"

// Neon Auth handles authentication via JWT at the database level
// No client-side auth provider needed - RLS policies enforce user isolation

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
