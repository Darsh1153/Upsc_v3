# Complete Supabase Setup Guide

This guide will help you set up a complete Supabase project with all database tables, migrations, and admin user.

## Quick Start

Run the automated setup script:

```bash
cd admin-panel
node setup-supabase.js
```

The script will guide you through:
1. ✅ Creating/Configuring Supabase project
2. ✅ Creating all database tables
3. ✅ Running all migrations
4. ✅ Creating admin user
5. ✅ Updating environment variables

---

## Manual Setup (Step by Step)

If you prefer to set up manually, follow these steps:

### Step 1: Create Supabase Project

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: UPSC Prep
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be ready

### Step 2: Get Your Credentials

1. Go to: **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

3. Go to: **Settings** > **Database** > **Connect**
4. Select **"Connection pooling"** tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your database password
7. URL-encode special characters (`@` → `%40`)

### Step 3: Update .env.local

Create or update `.env.local` in the `admin-panel` directory:

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database
DATABASE_URL=postgresql://postgres.your-project-id:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

### Step 4: Create Database Tables

#### Option A: Using Drizzle (Recommended)

```bash
cd admin-panel
npx drizzle-kit push
```

This will create all tables from the schema defined in `src/lib/db/schema.ts`.

#### Option B: Using SQL Migrations

Run each migration file in order:

1. **Mind Maps Tables:**
   ```bash
   # Copy SQL from migrations/create_mind_map_tables.sql
   # Run in Supabase SQL Editor
   ```

2. **Article MCQs Table:**
   ```bash
   # Copy SQL from migrations/create_article_mcqs_table.sql
   # Run in Supabase SQL Editor
   ```

3. **Notes & Tags with FTS:**
   ```bash
   # Copy SQL from migrations/20251209_create_notes_tags_fts.sql
   # Run in Supabase SQL Editor
   ```

### Step 5: Run SQL Migrations

Go to: **SQL Editor** in Supabase Dashboard

Run these migrations in order:

1. `migrations/create_mind_map_tables.sql`
2. `migrations/create_article_mcqs_table.sql`
3. `migrations/20251209_create_notes_tags_fts.sql`

Or use the automated script:

```bash
node setup-supabase.js
```

### Step 6: Create Admin User

#### Option A: Via Supabase Dashboard

1. Go to: **Authentication** > **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: `admin@upscprep.com`
   - **Password**: `admin123` (or your password)
   - ✅ **Check "Auto Confirm User"**
4. After creating, click on the user
5. Go to **"User Metadata"** section
6. Add:
   ```json
   {
     "name": "Admin User",
     "role": "admin"
   }
   ```

#### Option B: Via Script

```bash
npm run create-admin
```

Or with custom credentials:

```bash
node create-admin-user.js admin@example.com yourpassword "Admin Name"
```

### Step 7: Verify Setup

1. **Test database connection:**
   ```bash
   node test-database-connection.js
   ```

2. **Test Supabase connection:**
   ```bash
   node test-supabase.js
   ```

3. **Start the admin panel:**
   ```bash
   npm run dev
   ```

4. **Login at:** http://localhost:3000
   - Use the admin credentials you created

---

## Database Schema Overview

The following tables will be created:

### Core Tables
- `users` - User accounts
- `admin_users` - Admin accounts (legacy)
- `activity_logs` - Activity tracking

### Content Tables
- `articles` - News articles
- `article_mcqs` - MCQs for articles
- `maps` - Map images
- `notes` - User notes with FTS
- `tags` - Tags for notes
- `note_tags` - Note-tag relationships

### Learning Tables
- `roadmap_topics` - Roadmap topics
- `roadmap_subtopics` - Roadmap subtopics
- `roadmap_sources` - Roadmap sources
- `user_topic_progress` - User progress
- `history_timeline_events` - History timeline
- `visual_references` - Visual references

### Practice Tables
- `question_sets` - Question sets
- `practice_questions` - Practice questions

### Mind Maps
- `mind_maps` - Mind maps
- `mind_map_nodes` - Mind map nodes
- `mind_map_connections` - Mind map connections

---

## Troubleshooting

### "Project doesn't exist"
- Make sure you're logged into the correct Supabase account
- Check if the project was deleted or paused
- Create a new project if needed

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check that password is URL-encoded
- Ensure project is active (not paused)
- Try connection pooling format

### "Tables already exist"
- This is normal if you're re-running setup
- Tables won't be duplicated (using IF NOT EXISTS)

### "Admin user already exists"
- Use existing credentials to login
- Or delete the user and create a new one

### "Drizzle-kit push fails"
- Run migrations manually via SQL Editor
- Or use the SQL files in `migrations/` folder

---

## Next Steps

After setup is complete:

1. ✅ Start admin panel: `npm run dev`
2. ✅ Login with admin credentials
3. ✅ Create articles, maps, and manage content
4. ✅ Test mobile app integration

---

## Support

If you encounter issues:
1. Check the error messages carefully
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Check database connection string format
5. Review migration SQL files for syntax errors



