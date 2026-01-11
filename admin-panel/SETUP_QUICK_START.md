# Quick Start - Complete Supabase Setup

## 🚀 Fastest Way (Automated)

Run the setup script:

```bash
cd admin-panel
npm run setup
```

The script will guide you through everything!

---

## 📋 What Gets Set Up

✅ **Supabase Project Configuration**
- Environment variables (.env.local)
- Database connection
- Auth configuration

✅ **Database Tables** (20+ tables)
- Users, Articles, Maps, Notes, Tags
- Roadmap, Mind Maps, Questions
- Activity logs, and more

✅ **Database Migrations**
- Mind Maps tables
- Article MCQs table
- Notes & Tags with Full-Text Search

✅ **Admin User**
- Creates admin account
- Sets up admin role

---

## 🎯 Three Setup Methods

### Method 1: Automated Script (Easiest)

```bash
npm run setup
```

Follow the prompts to:
1. Enter Supabase credentials
2. Create database tables
3. Run migrations
4. Create admin user

### Method 2: SQL Editor (Fastest)

1. **Create Supabase project** at https://supabase.com/dashboard
2. **Get credentials** from Settings > API
3. **Update .env.local** with credentials
4. **Go to SQL Editor** in Supabase Dashboard
5. **Run** `migrations/00_complete_setup.sql`
6. **Create admin user** via Dashboard > Authentication > Users

### Method 3: Manual Step-by-Step

See `COMPLETE_SETUP_GUIDE.md` for detailed instructions.

---

## 📝 Prerequisites

Before running setup:

1. **Create Supabase Project:**
   - Go to: https://supabase.com/dashboard
   - Click "New Project"
   - Wait 2-3 minutes for setup

2. **Get Credentials:**
   - Settings > API → Copy: URL, anon key, service_role key
   - Settings > Database > Connect → Copy connection string

---

## ✅ After Setup

1. **Start the admin panel:**
   ```bash
   npm run dev
   ```

2. **Login at:** http://localhost:3000
   - Email: `admin@upscprep.com` (or what you set)
   - Password: `admin123` (or what you set)

3. **Verify setup:**
   - Check dashboard loads
   - Try creating an article
   - Test database connection

---

## 🔧 Troubleshooting

### "Project doesn't exist"
- Create new project at https://supabase.com/dashboard
- Or use existing project credentials

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- URL-encode special characters in password (`@` → `%40`)
- Check project is active (not paused)

### "Tables already exist"
- This is normal if re-running
- Tables use `IF NOT EXISTS` - safe to re-run

### Script fails
- Check all credentials are correct
- Ensure Supabase project is active
- Try Method 2 (SQL Editor) instead

---

## 📚 More Information

- **Complete Guide:** `COMPLETE_SETUP_GUIDE.md`
- **SQL File:** `migrations/00_complete_setup.sql`
- **Setup Script:** `setup-supabase.js`

---

## 🎉 You're Done!

Once setup is complete, you can:
- ✅ Login to admin panel
- ✅ Create articles, maps, and content
- ✅ Manage users and settings
- ✅ Use all features of the application



