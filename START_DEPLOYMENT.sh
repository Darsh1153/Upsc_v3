#!/bin/bash

# Start Vercel Deployment
# This will guide you through the deployment process

echo "🚀 Vercel Deployment for UPSC Prep"
echo "=================================="
echo ""

# Step 1: Login
echo "Step 1: Login to Vercel"
echo "-----------------------"
echo "Please run: vercel login"
echo "Email: vamsi.gdv@gmail.com"
echo "Password: ismaV1202!"
echo ""
read -p "Press Enter after you've logged in..."

# Verify login
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in. Please run: vercel login"
    exit 1
fi

echo "✅ Logged in as: $(vercel whoami)"
echo ""

# Step 2: Deploy Admin Panel
echo "Step 2: Deploy Admin Panel"
echo "---------------------------"
cd admin-panel

echo "Deploying admin panel..."
vercel --prod

echo ""
echo "✅ Admin Panel deployment initiated!"
echo ""

# Step 3: Deploy Mobile App
echo "Step 3: Deploy Mobile App"
echo "--------------------------"
cd ../my-app

echo "Building mobile app..."
npm run build

echo "Deploying mobile app..."
vercel --prod

echo ""
echo "✅ Mobile App deployment initiated!"
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "📝 IMPORTANT NEXT STEPS:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Add environment variables to both projects"
echo "3. See DEPLOY_NOW.md for variable values"
echo "4. Redeploy after adding variables"
echo ""



