# ✅ Final Setup Step - .env.local

Your Supabase keys are ready! Now you just need to add your database password.

## Quick Setup

Run this command (replace `YOUR_PASSWORD` with your actual database password):

```bash
cd admin-panel
node create-env-file.js YOUR_PASSWORD
```

**Example:**
```bash
node create-env-file.js MyPass@123
```

If your password has special characters, they'll be automatically URL-encoded.

**With custom region:**
```bash
node create-env-file.js YOUR_PASSWORD ap-southeast-1
```

---

## What's Already Configured

✅ **Project URL:** `https://sfukhupkvsjaqkbiskbj.supabase.co`  
✅ **Anon Key:** Set  
✅ **Service Key:** Set  
⏳ **Database Password:** Need to provide

---

## After Running the Command

1. **Test database connection:**
   ```bash
   node test-database-connection.js
   ```

2. **Test Supabase connection:**
   ```bash
   node test-supabase.js
   ```

3. **Create admin user:**
   - Go to: Supabase Dashboard > Authentication > Users
   - Click "Add user" → "Create new user"
   - Email: `admin@upscprep.com`
   - Password: `admin123`
   - ✅ Check "Auto Confirm User"
   - Add metadata: `{"role": "admin"}`

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Login at:** http://localhost:3000

---

## Need to Find Your Database Password?

1. Go to: Supabase Dashboard > Settings > Database
2. Look for "Database password" section
3. If you don't remember it, click "Reset database password"
4. Copy the new password and use it in the command above

---

## That's It! 🎉

Once you run the command with your password, everything will be set up!

