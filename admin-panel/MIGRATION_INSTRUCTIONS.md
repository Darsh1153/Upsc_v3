# 🚀 Quick Migration Instructions

## New Supabase Project
- **Project ID**: `pjubvuvqzwhvqxeeubcv`
- **URL**: `https://pjubvuvqzwhvqxeeubcv.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/pjubvuvqzwhvqxeeubcv

## ✅ What's Done
- ✅ Admin panel `.env.local` updated
- ✅ Mobile app `.env` updated
- ✅ Connections verified

## ⏳ What You Need to Do

### 1. Run Database Migration (REQUIRED)

**Go to SQL Editor:**
https://supabase.com/dashboard/project/pjubvuvqzwhvqxeeubcv/sql

**Run this file:**
- Open: `migrations/00_complete_setup.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **"Run"**

**Wait for:** "✅ Database setup complete!"

### 2. Create Admin User

After migration completes:

```bash
cd admin-panel
npm run create-admin
```

Or create via Dashboard:
- Authentication > Users > Add user
- Email: `admin@upscprep.com`
- Password: `admin123`
- ✅ Auto Confirm User
- Metadata: `{"role": "admin"}`

### 3. Test

```bash
# Test database
node test-database-connection.js

# Start app
npm run dev
```

## 🎉 Done!

After running the migration, everything will work!



