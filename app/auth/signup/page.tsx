"use client"

import { useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const user = useUser()
  const router = useRouter()

  // Redirect if already signed in
  if (user) {
    router.push("/app")
    return null
  }

  // TODO: Build custom sign up UI here
  // Neon Auth handles all authentication via stackApp
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <p className="text-gray-500 mt-2">Build your custom sign up UI here</p>
      </div>
    </div>
  )
}
