# Vercel Gateway Setup - Configuration Complete ✅

## What Has Been Configured

1. ✅ **Admin Panel** (`admin-panel/next.config.js`) - Added `basePath: '/admin'`
2. ✅ **Gateway Routing** (`my-app/vercel.json`) - Added rewrite rules for routing

## ⚠️ IMPORTANT: Update Vercel URLs

Before deploying, you **MUST** update both placeholder URLs in `my-app/vercel.json`:

### Step 1: Get Your Vercel Deployment URLs

1. Go to your Vercel dashboard
2. Find your **admin-panel** project and copy its deployment URL (e.g., `https://admin-panel-xyz.vercel.app`)
3. Find your **my-app** project and copy its deployment URL (e.g., `https://my-app-abc.vercel.app`)

### Step 2: Update vercel.json

Edit `my-app/vercel.json` and replace both placeholder URLs:

```json
{
  "rewrites": [
    {
      "source": "/admin/:path*",
      "destination": "https://YOUR-ADMIN-APP-URL.vercel.app/admin/:path*"
    },
    {
      "source": "/:path*",
      "destination": "https://YOUR-MAIN-APP-URL.vercel.app/:path*"
    }
  ]
}
```

**Replace:**
- `YOUR-ADMIN-APP-URL.vercel.app` with your actual admin panel Vercel URL
- `YOUR-MAIN-APP-URL.vercel.app` with your actual main app (my-app) Vercel URL

## Deployment Steps

### 1. Deploy Admin Panel First

```bash
cd admin-panel
# Make sure basePath is set in next.config.js (already done)
vercel deploy --prod
```

After deployment, copy the Vercel URL (e.g., `https://admin-panel-xyz.vercel.app`)

### 2. Update Gateway vercel.json

Edit `my-app/vercel.json` and replace both placeholder URLs:
- Replace `admin-app.vercel.app` with your actual admin panel Vercel URL from step 1
- Replace `main-app.vercel.app` with your actual main app Vercel URL

### 3. Deploy Main App (Gateway)

```bash
cd my-app
vercel deploy --prod
```

### 4. Connect Domain to Gateway Project

1. Go to Vercel Dashboard → Your `my-app` project
2. Go to **Settings** → **Domains**
3. Add your domain: `prepassist.in`
4. Add `www.prepassist.in` as well

### 5. Configure DNS on Hostinger

1. Log in to Hostinger hPanel
2. Go to **Domains** → **[Your Domain]** → **DNS / Nameservers**
3. Add/Update these DNS records:

   **A Record:**
   - **Host**: `@`
   - **Value/Points to**: `76.76.21.21`
   - **TTL**: 3600 (or default)

   **CNAME Record:**
   - **Host**: `www`
   - **Value/Points to**: `cname.vercel-dns.com`
   - **TTL**: 3600 (or default)

4. Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)

## Testing

After DNS propagation:

- ✅ Main app: `https://prepassist.in/` → Should show your React Native Expo app
- ✅ Admin panel: `https://prepassist.in/admin` → Should show your Next.js admin panel
- ✅ Admin dashboard: `https://prepassist.in/admin/dashboard` → Should work correctly

## Troubleshooting

### Admin panel shows 404
- Verify `basePath: '/admin'` is set in `admin-panel/next.config.js`
- Check that the admin app URL in `vercel.json` is correct
- Ensure admin app is deployed and accessible at its Vercel URL

### Main app not loading
- Check that `my-app` is deployed successfully
- Verify DNS records are correct
- Check Vercel domain configuration

### Assets (CSS/JS) not loading on admin panel
- This usually means `basePath` is not set correctly
- Verify `basePath: '/admin'` in `next.config.js`
- Redeploy admin panel after fixing

## Architecture Summary

```
prepassist.in/admin/* → Gateway (my-app) → Rewrites to → admin-app.vercel.app/admin/*
prepassist.in/*      → Gateway (my-app) → Rewrites to → main-app.vercel.app/*
```

The gateway project (`my-app`) is connected to your domain and handles all routing.

