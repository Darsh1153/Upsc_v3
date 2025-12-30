# How to Get the Correct Supabase Database Connection String

## The Problem
The database connection is failing because the hostname cannot be resolved. This usually means:
1. The connection string format is incorrect
2. The Supabase project might be paused
3. The password or project reference might be wrong

## Solution: Get the Exact Connection String from Supabase

### Step 1: Go to Your Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh
2. Make sure your project is **active** (not paused)

### Step 2: Get the Connection String
1. Click the **"Connect"** button (usually at the top of the project dashboard)
2. Or go to: **Settings** > **Database**
3. Look for **"Connection string"** or **"Connection pooling"** section
4. Select **"Connection pooling"** (recommended for server applications)
5. Copy the connection string shown

### Step 3: Update .env.local
Replace the `DATABASE_URL` in `.env.local` with the connection string you copied, making sure to:
- Replace `[YOUR-PASSWORD]` with your actual database password: `Darshu@1153`
- URL-encode special characters: `@` becomes `%40`

Example format you might see:
```
postgresql://postgres.otenrlbuohajthlgjyjh:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

After replacing password:
```
postgresql://postgres.otenrlbuohajthlgjyjh:Darshu%401153@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 4: Restart Your Server
```bash
cd admin-panel
# Stop server (Ctrl+C)
npm run dev
```

## Alternative: Check Project Status

If the connection still doesn't work:
1. Check if your Supabase project is paused
2. Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/settings/general
3. If paused, click "Resume project"
4. Wait a few minutes for the database to become available

## Quick Test

After updating, test the connection:
```bash
cd admin-panel
node test-database-connection.js
```


