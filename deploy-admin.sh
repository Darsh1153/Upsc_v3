#!/bin/bash

# Deploy Admin Panel to Vercel
# Usage: ./deploy-admin.sh

echo "🚀 Deploying Admin Panel to Vercel..."
echo ""

cd admin-panel

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "Please run: vercel login"
    echo "Email: vamsi.gdv@gmail.com"
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Deploy
echo "📦 Deploying..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add environment variables via Vercel dashboard or:"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_URL"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   vercel env add SUPABASE_SERVICE_ROLE_KEY"
echo "   vercel env add DATABASE_URL"
echo ""
echo "2. Redeploy after adding env vars:"
echo "   vercel --prod"



