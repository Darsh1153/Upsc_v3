# Setup New Supabase Project

Since the configured Supabase project doesn't exist, here's how to set up a new one or use an existing project.

## Option 1: Create a New Supabase Project

### Step 1: Create Project
1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: UPSC Prep (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be ready

### Step 2: Get Your Credentials
1. Once the project is ready, go to: **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string)
   - **service_role** key (long string - keep this secret!)

### Step 3: Update .env.local
Open `.env.local` in the `admin-panel` directory and update:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Also update the `DATABASE_URL`:
1. Go to: **Settings** > **Database**
2. Click **"Connect"** button
3. Select **"Connection pooling"** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. URL-encode special characters (`@` → `%40`)

Example:
```env
DATABASE_URL=postgresql://postgres.your-project-id:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

### Step 4: Create Admin User
1. Go to: **Authentication** > **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: `admin@upscprep.com` (or your email)
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

### Step 5: Test
```bash
cd admin-panel
npm run dev
```

Then go to http://localhost:3000 and login!

---

## Option 2: Use Existing Project

If you already have a Supabase project:

1. Go to: https://supabase.com/dashboard
2. Select your project from the list
3. Get the credentials (Settings > API)
4. Update `.env.local` as described in Step 3 above
5. Create admin user as described in Step 4 above

---

## Quick Reference

After setup, your `.env.local` should have:
```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
```

---

## Troubleshooting

### "Project doesn't exist"
- Make sure you're logged into the correct Supabase account
- Check if the project was deleted or paused
- Create a new project if needed

### "Invalid credentials"
- Double-check you copied the keys correctly
- Make sure there are no extra spaces
- Restart your dev server after updating `.env.local`

### "Can't connect to database"
- Verify the database password is correct
- Check that special characters are URL-encoded
- Make sure the project is active (not paused)



