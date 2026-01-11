# Step-by-Step Supabase Setup

Follow these steps to create a complete Supabase setup with all database tables and migrations.

## Step 1: Create Supabase Project

1. Go to: **https://supabase.com/dashboard**
2. Click **"New Project"**
3. Fill in:
   - **Name**: `UPSC Prep` (or any name)
   - **Database Password**: Choose a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. **Wait 2-3 minutes** for the project to be ready

## Step 2: Get Your Credentials

### A. Get API Credentials

1. In your project dashboard, go to: **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string starting with `eyJ...` - keep this secret!)

### B. Get Database Connection String

1. Go to: **Settings** > **Database**
2. Click **"Connect"** button
3. Select **"Connection pooling"** tab
4. Copy the connection string (looks like: `postgresql://postgres.xxxxx:...`)
5. Replace `[YOUR-PASSWORD]` with your database password
6. **Important**: URL-encode special characters:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

Example:
```
postgresql://postgres.xxxxx:MyPass%40123@aws-0-region.pooler.supabase.com:6543/postgres
```

## Step 3: Update .env.local

Open `.env.local` in the `admin-panel` directory and add/update:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres.your-project-id:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

Replace all placeholders with your actual values!

## Step 4: Run Database Migration

### Option A: Using SQL Editor (Recommended - Fastest)

1. In Supabase Dashboard, go to: **SQL Editor**
2. Click **"New query"**
3. Open the file: `migrations/00_complete_setup.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. Wait for completion (should take 10-30 seconds)

You should see: `✅ Database setup complete!`

### Option B: Using Drizzle (Alternative)

```bash
cd admin-panel
npm run setup:db
```

Then run migrations manually via SQL Editor:
- `migrations/create_mind_map_tables.sql`
- `migrations/create_article_mcqs_table.sql`
- `migrations/20251209_create_notes_tags_fts.sql`

## Step 5: Create Admin User

### Option A: Via Supabase Dashboard (Easiest)

1. Go to: **Authentication** > **Users**
2. Click **"Add user"** button (top right)
3. Select **"Create new user"**
4. Enter:
   - **Email**: `admin@upscprep.com`
   - **Password**: `admin123` (or your password)
   - ✅ **Check "Auto Confirm User"** (important!)
5. Click **"Create user"**
6. After creation, click on the user
7. Scroll to **"User Metadata"** section
8. Click **"Edit"** or **"Add metadata"**
9. Add this JSON:
   ```json
   {
     "name": "Admin User",
     "role": "admin"
   }
   ```
10. Click **"Save"**

### Option B: Via Script

```bash
cd admin-panel
npm run create-admin
```

Or with custom credentials:
```bash
node create-admin-user.js admin@example.com yourpassword "Admin Name"
```

## Step 6: Verify Setup

1. **Test database connection:**
   ```bash
   cd admin-panel
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

4. **Login:**
   - Go to: http://localhost:3000
   - Email: `admin@upscprep.com` (or what you set)
   - Password: `admin123` (or what you set)

## ✅ What Was Created

After running the migration, you'll have:

### Core Tables
- ✅ `users` - User accounts
- ✅ `admin_users` - Admin accounts
- ✅ `activity_logs` - Activity tracking

### Content Tables
- ✅ `articles` - News articles
- ✅ `article_mcqs` - MCQs for articles
- ✅ `maps` - Map images
- ✅ `notes` - User notes with full-text search
- ✅ `tags` - Tags for notes
- ✅ `note_tags` - Note-tag relationships

### Learning Tables
- ✅ `roadmap_topics` - Roadmap topics
- ✅ `roadmap_subtopics` - Roadmap subtopics
- ✅ `roadmap_sources` - Roadmap sources
- ✅ `user_topic_progress` - User progress
- ✅ `history_timeline_events` - History timeline
- ✅ `visual_references` - Visual references

### Practice Tables
- ✅ `question_sets` - Question sets
- ✅ `practice_questions` - Practice questions

### Mind Maps
- ✅ `mind_maps` - Mind maps
- ✅ `mind_map_nodes` - Mind map nodes
- ✅ `mind_map_connections` - Mind map connections

### Features Enabled
- ✅ Full-text search on notes
- ✅ Tag system with usage tracking
- ✅ Indexes for performance
- ✅ Triggers for automatic updates

## 🎉 You're Done!

Your Supabase project is now fully set up with:
- ✅ All database tables
- ✅ All migrations applied
- ✅ Admin user created
- ✅ Ready to use!

## 🆘 Troubleshooting

### "Project doesn't exist"
- Make sure you created the project in Step 1
- Check you're logged into the correct Supabase account

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check password is URL-encoded
- Ensure project is active (not paused)

### "Migration fails"
- Check SQL syntax in SQL Editor
- Make sure you copied the entire SQL file
- Try running migrations one by one

### "Admin user can't login"
- Verify "Auto Confirm User" was checked
- Check user metadata has `"role": "admin"`
- Try resetting password in Supabase Dashboard

## 📚 Additional Resources

- **Quick Start**: `SETUP_QUICK_START.md`
- **Complete Guide**: `COMPLETE_SETUP_GUIDE.md`
- **SQL File**: `migrations/00_complete_setup.sql`
- **Setup Script**: `setup-supabase.js` (run with `npm run setup`)



