#!/bin/bash

# Deploy Both Apps to Vercel
# This script will guide you through deploying both admin panel and mobile app

echo "🚀 Vercel Deployment Script"
echo "=========================="
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo ""
    echo "Please login first:"
    echo "  vercel login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Logged in to Vercel as: $(vercel whoami)"
echo ""

# Deploy Admin Panel
echo "📦 Step 1: Deploying Admin Panel..."
echo "===================================="
cd admin-panel

echo "Running: vercel --prod"
vercel --prod --yes

ADMIN_URL=$(vercel ls --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
echo "✅ Admin Panel deployed!"
if [ ! -z "$ADMIN_URL" ]; then
    echo "   URL: $ADMIN_URL"
fi
echo ""

# Deploy Mobile App
echo "📱 Step 2: Deploying Mobile App..."
echo "==================================="
cd ../my-app

echo "Building..."
npm run build

echo "Running: vercel --prod"
vercel --prod --yes

MOBILE_URL=$(vercel ls --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
echo "✅ Mobile App deployed!"
if [ ! -z "$MOBILE_URL" ]; then
    echo "   URL: $MOBILE_URL"
fi
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "📝 IMPORTANT: Add environment variables in Vercel Dashboard:"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Click on each project"
echo "   3. Settings → Environment Variables"
echo "   4. Add the variables (see QUICK_DEPLOY.md)"
echo "   5. Redeploy after adding variables"
echo ""



