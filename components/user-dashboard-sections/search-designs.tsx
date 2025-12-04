"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const DESIGNS = [
  {
    id: "design-1",
    name: "Classic",
    description: "Traditional floating search button with modal",
    preview: "🔍 Bottom Right",
  },
  {
    id: "design-2",
    name: "Minimalist",
    description: "Clean, subtle search experience",
    preview: "✨ Minimal",
  },
  {
    id: "design-3",
    name: "Modern",
    description: "Contemporary design with animations",
    preview: "🎨 Modern",
  },
  {
    id: "design-4",
    name: "Compact",
    description: "Space-efficient for small screens",
    preview: "📱 Compact",
  },
  {
    id: "design-5",
    name: "Elegant",
    description: "Premium, sophisticated appearance",
    preview: "👑 Elegant",
  },
  {
    id: "design-6",
    name: "Bold",
    description: "High-contrast, attention-grabbing",
    preview: "⚡ Bold",
  },
  {
    id: "design-7",
    name: "Subtle",
    description: "Understated, non-intrusive design",
    preview: "🎯 Subtle",
  },
  {
    id: "design-8",
    name: "Colorful",
    description: "Vibrant, playful design",
    preview: "🌈 Colorful",
  },
  {
    id: "design-9",
    name: "Dark Mode",
    description: "Optimized for dark theme websites",
    preview: "🌙 Dark",
  },
]

export function SearchDesigns() {
  const [selectedDesign, setSelectedDesign] = useState("design-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Search Designs</h1>
        <p className="text-muted-foreground">Choose your widget style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESIGNS.map((design) => (
          <div
            key={design.id}
            onClick={() => setSelectedDesign(design.id)}
            className={`border rounded-lg p-4 cursor-pointer transition ${
              selectedDesign === design.id
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{design.name}</h3>
                <p className="text-sm text-muted-foreground">{design.description}</p>
              </div>
              {selectedDesign === design.id && (
                <Badge className="ml-2">Active</Badge>
              )}
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 rounded p-4 mb-3 text-center text-sm font-medium">
              {design.preview}
            </div>
            <Button
              size="sm"
              variant={selectedDesign === design.id ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedDesign(design.id)}
            >
              {selectedDesign === design.id ? "Selected" : "Select Design"}
            </Button>
          </div>
        ))}
      </div>

      {/* Snippet Preview */}
      <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-950">
        <h2 className="text-lg font-semibold mb-4">Your Embed Code</h2>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto font-mono text-sm">
          <pre>{`<script src="https://bridgit-ai.com/embed.js"
  data-site-key="pk_tattty_main_001"
  data-design="${selectedDesign}"></script>`}</pre>
        </div>
        <Button className="w-full">Copy Code</Button>
      </div>

      {/* Live Preview */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg h-48 flex items-center justify-center text-muted-foreground">
          Preview will show how the widget appears on your site
        </div>
      </div>
    </div>
  )
}
