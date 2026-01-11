# 🚀 Complete Supabase Setup - README

## Quick Setup (5 Minutes)

### 1. Create Supabase Project
- Go to: https://supabase.com/dashboard
- Click **"New Project"**
- Name: `UPSC Prep`
- Set a database password (SAVE IT!)
- Wait 2-3 minutes

### 2. Get Credentials
- **Settings > API**: Copy URL, anon key, service_role key
- **Settings > Database > Connect**: Copy connection string (pooling)
- Replace `[YOUR-PASSWORD]` and URL-encode special chars (`@` → `%40`)

### 3. Update .env.local
Create/update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-id:password@aws-0-region.pooler.supabase.com:6543/postgres
```

### 4. Run Database Migration
- Go to: **SQL Editor** in Supabase Dashboard
- Open: `migrations/00_complete_setup.sql`
- Copy entire file → Paste in SQL Editor → Click **"Run"**

### 5. Create Admin User
- Go to: **Authentication > Users**
- Click **"Add user"** → **"Create new user"**
- Email: `admin@upscprep.com`
- Password: `admin123`
- ✅ Check **"Auto Confirm User"**
- After creation, edit user → Add metadata:
  ```json
  {"name": "Admin User", "role": "admin"}
  ```

### 6. Start & Login
```bash
npm run dev
```
- Go to: http://localhost:3000
- Login with admin credentials

---

## 📁 Files Created

✅ **Setup Scripts:**
- `setup-supabase.js` - Automated setup (run: `npm run setup`)
- `create-admin-user.js` - Create admin user

✅ **SQL Migrations:**
- `migrations/00_complete_setup.sql` - **Complete setup (run this!)**
- `migrations/create_mind_map_tables.sql`
- `migrations/create_article_mcqs_table.sql`
- `migrations/20251209_create_notes_tags_fts.sql`

✅ **Documentation:**
- `STEP_BY_STEP_SETUP.md` - Detailed step-by-step guide
- `COMPLETE_SETUP_GUIDE.md` - Comprehensive guide
- `SETUP_QUICK_START.md` - Quick reference

---

## 🎯 What Gets Created

**20+ Database Tables:**
- Users, Articles, Maps, Notes, Tags
- Roadmap, Mind Maps, Questions
- Activity logs, and more

**Features:**
- Full-text search on notes
- Tag system with usage tracking
- All indexes and triggers
- Complete schema ready to use

---

## 🆘 Need Help?

1. **Follow:** `STEP_BY_STEP_SETUP.md` for detailed instructions
2. **Run:** `npm run setup` for automated setup
3. **Check:** SQL file `migrations/00_complete_setup.sql` is ready to run

---

## ✅ Verification

After setup, verify:
```bash
# Test database
node test-database-connection.js

# Test Supabase
node test-supabase.js

# Start app
npm run dev
```

Then login at http://localhost:3000

---

**That's it! Your Supabase project is ready! 🎉**



