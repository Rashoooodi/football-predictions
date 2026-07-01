#!/bin/bash
# ==========================================
# PRODUCTION MAINTENANCE SCRIPT (Ubuntu/Linux)
# ==========================================
echo "🚀 Starting Production Deployment..."

# 1. Enable Maintenance Mode in .env.local
echo "🛠️ Enabling Maintenance Mode..."
if grep -q "^MAINTENANCE_MODE=" .env.local; then
  sed -i 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE="true"/' .env.local
else
  echo 'MAINTENANCE_MODE="true"' >> .env.local
fi

# Reload PM2 so the middleware picks up the true flag instantly
pm2 reload nbr-predictions

# 2. Do "Website things"
echo "📦 Installing new dependencies..."
npm install
echo "📦 Restarting website things (Building Production Bundle)..."
npm run build

# Reload PM2 again to serve the newly built files while still in maintenance mode
pm2 reload nbr-predictions

# 3. Wait 20 seconds
echo "⏳ Build complete. Waiting 20 seconds to ensure stability..."
sleep 20

# 4. Disable Maintenance Mode
echo "✅ Disabling Maintenance Mode..."
sed -i 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE="false"/' .env.local

# Final reload to disable maintenance page and let users back in
pm2 reload nbr-predictions

echo "🎉 Deployment Complete. The website is live!"
