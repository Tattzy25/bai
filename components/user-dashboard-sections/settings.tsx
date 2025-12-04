"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="user@example.com" className="mt-2" disabled />
        </div>
        <div>
          <Label htmlFor="site-name">Site Name</Label>
          <Input id="site-name" defaultValue="My Site" className="mt-2" />
        </div>
        <div>
          <Label htmlFor="site-url">Site URL</Label>
          <Input id="site-url" defaultValue="https://example.com" className="mt-2" />
        </div>
        <Button>Update Account</Button>
      </div>

      {/* Plan & Billing */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Plan & Billing</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-950 rounded">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-semibold">Business</p>
              <Badge>Unlimited</Badge>
            </div>
          </div>
          <Button variant="outline">Manage Billing</Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="h-4 w-4" />
            <span>Email me when my search quota is low</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="h-4 w-4" />
            <span>Weekly analytics summary</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="h-4 w-4" />
            <span>Product updates and announcements</span>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-950 space-y-4">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Danger Zone</h2>
        <p className="text-sm text-red-800 dark:text-red-200">These actions cannot be undone.</p>
        <Button variant="destructive">Delete Site & Widget</Button>
      </div>
    </div>
  )
}
