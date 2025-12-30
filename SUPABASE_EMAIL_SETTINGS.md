# How to Disable Email Confirmation in Supabase

## Step-by-Step Instructions:

### Method 1: Via Supabase Dashboard (UI)

1. **Navigate to Authentication:**
   - In the left sidebar, click on **"Auth"** (the key/lock icon)
   - This will take you to the Authentication section

2. **Go to Providers:**
   - In the Auth section, you'll see a submenu
   - Click on **"Providers"** or **"Email"**
   - You should see settings for Email authentication

3. **Find Email Settings:**
   - Look for settings like:
     - "Enable email confirmations"
     - "Confirm email"
     - "Email confirmation required"
   - Turn this setting **OFF** or **DISABLED**

4. **Alternative Location:**
   - Sometimes it's under **Settings > Authentication > Email** instead
   - Or **Settings > Auth > Email Provider**

### Method 2: Direct URL

Try these direct links to your project's auth settings:

**Email Provider Settings:**
```
https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/providers
```

**Auth Settings:**
```
https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/settings
```

**General Settings:**
```
https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/settings/auth
```

### Method 3: Disable via SQL (Alternative)

If you can't find the toggle, you can disable it via SQL:

1. Go to **SQL Editor** in the left sidebar
2. Run this SQL:

```sql
-- Disable email confirmation requirement
UPDATE auth.config 
SET raw_base_config = jsonb_set(
  COALESCE(raw_base_config, '{}'::jsonb),
  '{email,enable_signup}',
  'true'::jsonb
);
```

### Method 4: Use Supabase API

The setting might be in the project config. You can check via the Supabase Management API.

### What to Look For:

The setting might be labeled as:
- ✅ "Enable email confirmations"
- ✅ "Require email confirmation"
- ✅ "Email confirmation"
- ✅ "Confirm email"
- ✅ "Auto confirm users"

Make sure it's set to **OFF** or **DISABLED**.

## Important Notes:

1. **New Supabase UI**: The interface might have changed. Look for any toggle related to "email" and "confirmation"
2. **Project Settings**: Sometimes this is in the main Settings page, not in Auth
3. **Auto-confirm**: There might be an "Auto-confirm users" option instead - enable that

## Quick Fix (Already Working):

Since we've already confirmed all existing users and added auto-confirmation code, **your login should work right now** even if you can't find the toggle. New users can be auto-confirmed by running the `confirm-all-users.js` script after they sign up.

## Need More Help?

If you still can't find it, try:
1. Take a screenshot of what you see in the Auth/Providers section
2. Check if there's a search bar - search for "confirm" or "email"
3. Look in Settings > General or Settings > Auth

