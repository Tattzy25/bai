"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CustomizeSearch() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-1">Customize Search</h1>
        <p className="text-muted-foreground">Personalize your widget to match your brand</p>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        {/* Colors */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex gap-2 mt-2">
                <input type="color" id="accent-color" defaultValue="#6366f1" className="h-10 w-20 rounded border" />
                <Input value="#6366f1" readOnly className="flex-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex gap-2 mt-2">
                <input type="color" id="text-color" defaultValue="#111827" className="h-10 w-20 rounded border" />
                <Input value="#111827" readOnly className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Position</h2>
          <div className="grid grid-cols-2 gap-3">
            {["bottom-right", "bottom-left", "top-right", "top-left"].map((pos) => (
              <Button key={pos} variant="outline" className="justify-start">
                📍 {pos.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Placeholder */}
        <div>
          <Label htmlFor="placeholder">Search Placeholder Text</Label>
          <Input
            id="placeholder"
            defaultValue="Search articles..."
            className="mt-2"
          />
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Behavior</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span>Enable autocomplete suggestions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span>Show "Powered by Bridgit" badge</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="h-4 w-4" />
              <span>Enable keyboard shortcut (Cmd+K)</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button size="lg" className="w-full">Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
