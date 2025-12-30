# Database Connection Fix

## Issue
The database connection is failing because the project reference `izyifrlatanmvekbzzph` cannot be resolved.

## Solution
Use the **same Supabase project** that's already working for authentication (`otenrlbuohajthlgjyjh`).

## Steps to Fix

1. **Get your database password:**
   - Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/settings/database
   - Find the "Database password" section
   - If you don't know it, click "Reset database password" and copy the new password

2. **Update DATABASE_URL in `.env.local`:**
   
   **Option A: Connection Pooling (Recommended)**
   ```
   DATABASE_URL=postgresql://postgres.otenrlbuohajthlgjyjh:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   
   **Option B: Direct Connection**
   ```
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.otenrlbuohajthlgjyjh.supabase.co:5432/postgres
   ```
   
   Replace `[YOUR_PASSWORD]` with your actual database password.
   
   **Important:** If your password contains special characters like `@`, URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - etc.

3. **Restart your dev server:**
   ```bash
   cd admin-panel
   npm run dev
   ```

4. **Test the connection:**
   ```bash
   node test-database-connection.js
   ```

## Why Use the Same Project?
- Your authentication is already working with `otenrlbuohajthlgjyjh`
- Using the same project ensures consistency
- All data (users, articles, maps) will be in one database
- Simpler configuration and management

## Alternative: Use Different Project
If you need to use the `izyifrlatanmvekbzzph` project:
1. Make sure the project is active (not paused)
2. Get the exact connection string from Supabase Dashboard > Connect button
3. Verify the project reference is correct


