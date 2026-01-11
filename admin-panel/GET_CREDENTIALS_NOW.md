# ✅ SQL Migration Complete! Now Get Your Credentials

Your database is set up! Now you need to configure `.env.local` with your Supabase credentials.

## Quick Steps:

### 1. Get API Credentials

1. In Supabase Dashboard, click: **Settings** (gear icon) → **API**
2. Copy these 3 values:

   **Project URL:**
   ```
   https://sfukhupkvsjaqkbiskbj.supabase.co
   ```

   **anon public key:**
   - Click "Reveal" next to "anon public"
   - Copy the long string (starts with `eyJ...`)

   **service_role key:**
   - Click "Reveal" next to "service_role"
   - Copy the long string (starts with `eyJ...`)
   - ⚠️ Keep this secret!

### 2. Get Database Connection String

1. In Supabase Dashboard, click: **Settings** → **Database**
2. Click the **"Connect"** button
3. Select **"Connection pooling"** tab
4. Copy the connection string shown
5. **Replace `[YOUR-PASSWORD]`** with your actual database password
6. **URL-encode special characters:**
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

   Example: If password is `MyPass@123`, use `MyPass%40123`

### 3. Create .env.local File

**Option A: Use the setup script (Easiest)**

```bash
cd admin-panel
npm run setup:env
```

Then paste your credentials when prompted.

**Option B: Manual setup**

1. Create `.env.local` file in `admin-panel` directory
2. Copy this template and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sfukhupkvsjaqkbiskbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
DATABASE_URL=postgresql://postgres.sfukhupkvsjaqkbiskbj:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

**Important:** 
- Replace `your-password` with your actual password (URL-encoded)
- Replace `region` with your actual region (e.g., `ap-southeast-1`, `us-east-1`)

### 4. Verify Setup

```bash
cd admin-panel

# Test database connection
node test-database-connection.js

# Test Supabase connection  
node test-supabase.js
```

### 5. Create Admin User

1. In Supabase Dashboard: **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - Email: `admin@upscprep.com`
   - Password: `admin123`
   - ✅ Check **"Auto Confirm User"**
4. After creation, click on the user
5. Scroll to **"User Metadata"** → Click **"Edit"**
6. Add:
   ```json
   {
     "name": "Admin User",
     "role": "admin"
   }
   ```

### 6. Start the App!

```bash
npm run dev
```

Then go to: **http://localhost:3000** and login! 🎉

---

## Need Help?

- Run: `npm run setup:env` for interactive setup
- Check: `ENV_TEMPLATE.md` for detailed template
- See: `QUICK_SETUP_INSTRUCTIONS.md` for full guide



