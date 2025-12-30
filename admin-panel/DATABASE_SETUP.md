# Database Connection Setup

## ✅ DATABASE_URL Configured

The `DATABASE_URL` has been added to your `.env.local` file:

```
DATABASE_URL=postgresql://postgres:Darshu%401153@db.izyifrlatanmvekbzzph.supabase.co:5432/postgres
```

**Note:** The `@` symbol in the password has been URL-encoded as `%40`.

## 🔍 Verify Connection

To test if the database connection works, run:

```bash
cd admin-panel
node test-database-connection.js
```

## ⚠️ Troubleshooting

If you get connection errors:

1. **Verify the password is correct:**
   - Go to Supabase Dashboard > Settings > Database
   - Check or reset your database password

2. **Get the exact connection string from Supabase:**
   - Click the **"Connect"** button in your Supabase project dashboard
   - Select **"Connection string"** tab
   - Copy the connection string shown there
   - Replace `[YOUR-PASSWORD]` with your actual password

3. **Check project status:**
   - Make sure your Supabase project is active (not paused)
   - Verify the project reference matches: `izyifrlatanmvekbzzph`

4. **Try connection pooling format:**
   If direct connection doesn't work, try the pooling format:
   ```
   postgresql://postgres.izyifrlatanmvekbzzph:Darshu%401153@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   (Replace `[REGION]` with your actual region, e.g., `us-east-1`)

## 📝 Next Steps

Once the connection works:

1. **Run database migrations** (if you have any):
   ```bash
   cd admin-panel
   # If using drizzle-kit:
   npx drizzle-kit push
   ```

2. **Test the admin panel:**
   ```bash
   npm run dev
   ```

3. **Verify database operations:**
   - Try creating an article
   - Check if data is being saved

## 🔐 Security Note

The database password is stored in `.env.local` which should **never** be committed to git. Make sure `.env.local` is in your `.gitignore` file.


