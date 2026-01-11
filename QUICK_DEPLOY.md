# ⚡ Quick Vercel Deployment

## 🚀 Fastest Way to Deploy

### 1. Login to Vercel

```bash
vercel login
# Email: vamsi.gdv@gmail.com
# Password: ismaV1202!
```

### 2. Deploy Admin Panel

```bash
cd admin-panel
vercel
```

When prompted:
- Set up and deploy? **Y**
- Project name: `upsc-admin-panel`
- Directory: `./`
- Override settings? **N**

### 3. Deploy Mobile App

```bash
cd ../my-app
vercel
```

When prompted:
- Set up and deploy? **Y**
- Project name: `upsc-mobile-app`
- Directory: `./`
- Override settings? **N**

### 4. Add Environment Variables

**Via Vercel Dashboard (Easiest):**

1. Go to: https://vercel.com/dashboard
2. Click on each project
3. Go to **Settings** → **Environment Variables**
4. Add the variables (see below)

**Via CLI:**

```bash
# Admin Panel
cd admin-panel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production

# Mobile App
cd ../my-app
vercel env add EXPO_PUBLIC_SUPABASE_URL production
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
vercel env add EXPO_PUBLIC_OPENROUTER_API_KEY production
```

### 5. Redeploy

After adding env vars, redeploy:

```bash
# Admin Panel
cd admin-panel
vercel --prod

# Mobile App
cd ../my-app
vercel --prod
```

## 📋 Environment Variables

### Admin Panel
```
NEXT_PUBLIC_SUPABASE_URL=https://pjubvuvqzwhvqxeeubcv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDU0NjYsImV4cCI6MjA4MzcyMTQ2Nn0.S6c_saGG8tVNvAegb8e9eP3d5PbPlY0BLDnM0HR5n_0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0NTQ2NiwiZXhwIjoyMDgzNzIxNDY2fQ.xwy9_h8bLPWGUZ1zie8TvQ8vy1fJiBEB2NQAlY66EUU
DATABASE_URL=postgresql://postgres:Darshu%401153@db.pjubvuvqzwhvqxeeubcv.supabase.co:5432/postgres
```

### Mobile App
```
EXPO_PUBLIC_SUPABASE_URL=https://pjubvuvqzwhvqxeeubcv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDU0NjYsImV4cCI6MjA4MzcyMTQ2Nn0.S6c_saGG8tVNvAegb8e9eP3d5PbPlY0BLDnM0HR5n_0
EXPO_PUBLIC_OPENROUTER_API_KEY=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
```

## ✅ Done!

After deployment, you'll get URLs like:
- Admin Panel: `https://upsc-admin-panel.vercel.app`
- Mobile App: `https://upsc-mobile-app.vercel.app`

---

**See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.**



