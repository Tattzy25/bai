"use client"

import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()

  // Neon Auth handles authentication via JWT
  // This is a placeholder sign in page
  // In production, integrate with Neon Auth UI

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-gray-500 mt-2">Neon Auth handles authentication</p>
        <p className="text-sm text-gray-400 mt-4">Use Neon Auth Console to configure OAuth providers (Google, GitHub, Email)</p>
      </div>
    </div>
  )
}
