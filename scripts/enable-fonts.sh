#!/bin/bash
# Script to re-enable Google Fonts after build

echo "🔧 Re-enabling Google Fonts..."

if [ -f "app/layout.tsx.backup" ]; then
  mv app/layout.tsx.backup app/layout.tsx
  echo "✅ Fonts re-enabled from backup."
else
  echo "⚠️  No backup found. Fonts already enabled or backup was removed."
fi
