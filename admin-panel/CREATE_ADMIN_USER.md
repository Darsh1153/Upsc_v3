# Create Admin User - Quick Guide

Since there's a network connectivity issue with the automated script, here are the easiest ways to create an admin user:

## Method 1: Via Supabase Dashboard (Easiest - Recommended)

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/users

2. **Create New User:**
   - Click the **"Add user"** button (top right)
   - Select **"Create new user"**

3. **Enter User Details:**
   - **Email**: `admin@upscprep.com` (or any email you prefer)
   - **Password**: `admin123` (or a strong password of your choice)
   - **Auto Confirm User**: ✅ **Check this box** (important - allows immediate login)

4. **Click "Create user"**

5. **Set Admin Role (Important):**
   - After the user is created, click on the user in the list
   - Go to **"User Metadata"** section
   - Click **"Edit"** or **"Add metadata"**
   - Add this JSON:
     ```json
     {
       "name": "Admin User",
       "role": "admin"
     }
     ```
   - Click **"Save"**

6. **Done!** You can now login with:
   - **Email**: The email you entered
   - **Password**: The password you set

---

## Method 2: Via Supabase SQL Editor

1. **Go to SQL Editor:**
   - Open: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/sql

2. **Run this SQL** (replace email and password as needed):
   ```sql
   -- Create admin user with password hashing
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_app_meta_data,
     raw_user_meta_data,
     is_super_admin
   )
   VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'admin@upscprep.com',  -- Change this to your email
     crypt('admin123', gen_salt('bf')),  -- Change this to your password
     NOW(),
     NOW(),
     NOW(),
     NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"name":"Admin User","role":"admin"}',
     false
   );
   ```

3. **Click "Run"** to execute the SQL

4. **Done!** Login with your credentials

---

## Default Credentials (if using defaults)

If you use the default values from the script:
- **Email**: `admin@upscprep.com`
- **Password**: `admin123`

---

## Test Login

After creating the user:

1. **Start the admin panel:**
   ```bash
   cd admin-panel
   npm run start
   ```

2. **Open browser:**
   - Go to: http://localhost:3000

3. **Login** with your credentials

4. **You should be redirected to:** http://localhost:3000/dashboard

---

## Troubleshooting

### "Invalid email or password"
- Verify the user exists in Supabase Dashboard
- Make sure "Auto Confirm User" was checked when creating
- Check that user metadata has `"role": "admin"`

### Network connectivity issues
- Check if your Supabase project is active (not paused)
- Verify internet connection
- Try accessing Supabase Dashboard directly in browser

### User exists but can't login
- Reset password via Supabase Dashboard
- Or delete the user and create a new one



