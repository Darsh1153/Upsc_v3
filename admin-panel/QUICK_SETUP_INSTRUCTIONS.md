# 🚀 Quick Setup Instructions

## Step 1: Run SQL Migration (You're Already Here!)

You're in the Supabase SQL Editor. Here's what to do:

1. **Open the SQL file in your code editor:**
   - File: `admin-panel/migrations/00_complete_setup.sql`
   - Select ALL (Cmd/Ctrl + A)
   - Copy (Cmd/Ctrl + C)

2. **Paste into Supabase SQL Editor:**
   - Paste into the editor (where you are now)
   - Click **"Run"** button (green button, bottom right)
   - Or press: **Cmd + Enter**

3. **Wait for success message:**
   - You should see: "✅ Database setup complete!"

---

## Step 2: Get Your Supabase Credentials

### A. Get API Credentials

1. In Supabase Dashboard, go to: **Settings** > **API**
2. Copy these 3 values:
   - **Project URL** (e.g., `https://sfukhupkvsjaqkbiskbj.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string starting with `eyJ...`)

### B. Get Database Connection String

1. Go to: **Settings** > **Database**
2. Click **"Connect"** button
3. Select **"Connection pooling"** tab
4. Copy the connection string
5. **Replace `[YOUR-PASSWORD]`** with your database password
6. **URL-encode special characters:**
   - If password has `@`, change it to `%40`
   - Example: `MyPass@123` → `MyPass%40123`

Example connection string:
```
postgresql://postgres.sfukhupkvsjaqkbiskbj:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

---

## Step 3: Set Up .env.local

### Option A: Use the Setup Script (Easiest)

```bash
cd admin-panel
node setup-env.js
```

Follow the prompts and paste your credentials.

### Option B: Manual Setup

1. Open `.env.local` in `admin-panel` directory
2. Add/update with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://sfukhupkvsjaqkbiskbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection
DATABASE_URL=postgresql://postgres.sfukhupkvsjaqkbiskbj:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

**Replace:**
- `your-anon-key-here` → Your anon key from Settings > API
- `your-service-role-key-here` → Your service_role key from Settings > API
- `your-password` → Your database password (URL-encoded if needed)
- `region` → Your region (e.g., `ap-southeast-1`, `us-east-1`)

---

## Step 4: Create Admin User

1. In Supabase Dashboard, go to: **Authentication** > **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: `admin@upscprep.com`
   - **Password**: `admin123`
   - ✅ **Check "Auto Confirm User"**
4. After creation, click on the user
5. Scroll to **"User Metadata"**
6. Click **"Edit"** and add:
   ```json
   {
     "name": "Admin User",
     "role": "admin"
   }
   ```

---

## Step 5: Test & Start

```bash
cd admin-panel

# Test database connection
node test-database-connection.js

# Test Supabase connection
node test-supabase.js

# Start the admin panel
npm run dev
```

Then go to: **http://localhost:3000** and login!

---

## ✅ Summary

1. ✅ Run SQL migration (you're doing this now!)
2. ✅ Get credentials from Supabase Dashboard
3. ✅ Set up `.env.local` file
4. ✅ Create admin user
5. ✅ Start and test

---

## 🆘 Need Help?

- **SQL file location:** `admin-panel/migrations/00_complete_setup.sql`
- **Setup script:** `node setup-env.js`
- **Detailed guide:** `STEP_BY_STEP_SETUP.md`



