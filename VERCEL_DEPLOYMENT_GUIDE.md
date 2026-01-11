# 🚀 Vercel Deployment Guide

Deploy both Admin Panel and Mobile App to Vercel.

## 📋 Prerequisites

- ✅ Vercel CLI installed
- ✅ GitHub repository: https://github.com/Darsh1153/Upsc_v3
- ✅ Supabase credentials ready

## 🎯 Deployment Steps

### Step 1: Login to Vercel

```bash
vercel login
```

Enter your credentials:
- Email: `vamsi.gdv@gmail.com`
- Password: `ismaV1202!`

### Step 2: Deploy Admin Panel

```bash
cd admin-panel
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (first time)
- Project name: `upsc-admin-panel` (or your choice)
- Directory: `./` (current directory)
- Override settings? **No**

### Step 3: Add Environment Variables (Admin Panel)

After deployment, add environment variables:

```bash
cd admin-panel
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: https://pjubvuvqzwhvqxeeubcv.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDU0NjYsImV4cCI6MjA4MzcyMTQ2Nn0.S6c_saGG8tVNvAegb8e9eP3d5PbPlY0BLDnM0HR5n_0

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0NTQ2NiwiZXhwIjoyMDgzNzIxNDY2fQ.xwy9_h8bLPWGUZ1zie8TvQ8vy1fJiBEB2NQAlY66EUU

vercel env add DATABASE_URL
# Enter: postgresql://postgres:Darshu%401153@db.pjubvuvqzwhvqxeeubcv.supabase.co:5432/postgres
```

For each variable, select:
- **Environment**: Production, Preview, Development (select all)

### Step 4: Deploy Mobile App

```bash
cd ../my-app
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- Project name: `upsc-mobile-app` (or your choice)
- Directory: `./` (current directory)
- Override settings? **No**

### Step 5: Add Environment Variables (Mobile App)

```bash
cd my-app
vercel env add EXPO_PUBLIC_SUPABASE_URL
# Enter: https://pjubvuvqzwhvqxeeubcv.supabase.co

vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDU0NjYsImV4cCI6MjA4MzcyMTQ2Nn0.S6c_saGG8tVNvAegb8e9eP3d5PbPlY0BLDnM0HR5n_0

vercel env add EXPO_PUBLIC_OPENROUTER_API_KEY
# Enter: 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
```

## 🔄 Alternative: Deploy via Vercel Dashboard

### Option A: Import from GitHub

1. Go to: https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import from GitHub: `Darsh1153/Upsc_v3`
4. **Admin Panel:**
   - Root Directory: `admin-panel`
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Mobile App:**
   - Root Directory: `my-app`
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables in dashboard

## 📝 Environment Variables Summary

### Admin Panel
```
NEXT_PUBLIC_SUPABASE_URL=https://pjubvuvqzwhvqxeeubcv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:Darshu%401153@db.pjubvuvqzwhvqxeeubcv.supabase.co:5432/postgres
```

### Mobile App
```
EXPO_PUBLIC_SUPABASE_URL=https://pjubvuvqzwhvqxeeubcv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_OPENROUTER_API_KEY=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
```

## ✅ After Deployment

1. **Get deployment URLs** from Vercel dashboard
2. **Test admin panel** - Login with `admin@upscprep.com` / `admin123`
3. **Test mobile app** - Open in browser or test on device

## 🔗 Quick Deploy Scripts

See `deploy-admin.sh` and `deploy-mobile.sh` for automated deployment.

---

**Note**: Make sure database migrations are run in Supabase before deploying!



