#!/bin/bash
# Script to disable Google Fonts for CI/CD builds
# This is a workaround for network-restricted environments

echo "🔧 Disabling Google Fonts for build..."

# Backup original file
cp app/layout.tsx app/layout.tsx.backup

# Create a temporary file with fonts disabled
cat > app/layout.tsx << 'EOF'
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Bridgit-AI — Instant Search for Static Sites",
  description: "Go from URL to live search in under 2 minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
EOF

echo "✅ Fonts disabled. Build should now succeed."
echo "💡 To restore: ./scripts/enable-fonts.sh"
