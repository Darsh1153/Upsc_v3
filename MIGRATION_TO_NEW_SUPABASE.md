# Migration to New Supabase Account

## ✅ Step 1: Environment Variables Updated

Both apps have been updated with new Supabase credentials:

**New Project ID:** `pjubvuvqzwhvqxeeubcv`

- ✅ Admin Panel: `.env.local` updated
- ✅ Mobile App: `.env` updated
- ✅ Database connection: Verified
- ✅ Supabase connection: Verified

## 📊 Step 2: Run Database Migrations

The new database is empty (0 tables). You need to run the migrations:

### Option A: Using SQL Editor (Recommended)

1. Go to: **Supabase Dashboard** > **SQL Editor**
   - URL: https://supabase.com/dashboard/project/pjubvuvqzwhvqxeeubcv/sql

2. **Run Complete Setup:**
   - Open: `admin-panel/migrations/00_complete_setup.sql`
   - Copy entire file → Paste in SQL Editor → Click **"Run"**
   - Wait for: "✅ Database setup complete!"

3. **Run Essay Schema (Optional):**
   - Open: `admin-panel/migrations/01_essay_schema.sql`
   - Copy entire file → Paste in SQL Editor → Click **"Run"**

### Option B: Using Drizzle (Alternative)

```bash
cd admin-panel
npm run setup:db
```

Then run the SQL migrations manually.

## 👤 Step 3: Create Admin User

After migrations are complete:

```bash
cd admin-panel
npm run create-admin
```

Or create manually:
1. Go to: **Authentication** > **Users**
2. Click **"Add user"** → **"Create new user"**
3. Email: `admin@upscprep.com`
4. Password: `admin123`
5. ✅ Check **"Auto Confirm User"**
6. Add metadata: `{"name": "Admin User", "role": "admin"}`

## ✅ Step 4: Verify Everything Works

```bash
# Test database
cd admin-panel
node test-database-connection.js

# Test Supabase
node test-supabase.js

# Start admin panel
npm run dev
```

## 📱 Mobile App

The mobile app is already configured! Just:
1. Restart Expo: `cd my-app && npm start`
2. Users can sign up/login normally

## 🎯 Summary

- ✅ Environment variables updated
- ✅ Connections verified
- ⏳ **Next:** Run database migrations in Supabase SQL Editor
- ⏳ **Then:** Create admin user

---

**Important:** Run the SQL migrations before using the apps!



