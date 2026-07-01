#!/bin/bash
# ==========================================
# LOCAL MAINTENANCE SCRIPT (macOS)
# ==========================================
echo "🚀 Starting Local Maintenance Test..."

# 1. Enable Maintenance Mode in .env.local
echo "🛠️ Enabling Maintenance Mode..."
if grep -q "^MAINTENANCE_MODE=" .env.local; then
  sed -i '' 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE="true"/' .env.local
else
  echo 'MAINTENANCE_MODE="true"' >> .env.local
fi

echo "⚠️ Note: If you are running 'npm run dev', you may need to restart it to see the maintenance screen."

# 2. Do "Website things"
echo "📦 Restarting website things (Building locally)..."
npm run build

# 3. Wait 20 seconds
echo "⏳ Build complete. Waiting 20 seconds as requested..."
sleep 20

# 4. Disable Maintenance Mode
echo "✅ Disabling Maintenance Mode..."
sed -i '' 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE="false"/' .env.local

echo "🎉 Local maintenance test complete! Website is back to normal."
