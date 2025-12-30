# Login Setup Instructions

## ✅ Environment Variables Created

Your Supabase credentials have been configured:
- Admin Panel: `.env.local` file created
- Mobile App: `.env` file created

## Step 1: Create Your Admin User

You need to create a user in Supabase before you can login:

### Option A: Via Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/users
2. Click **"Add user"** button (top right)
3. Select **"Create new user"**
4. Enter:
   - **Email**: Your email (e.g., `admin@example.com`)
   - **Password**: A strong password
   - **Auto Confirm User**: Check this box (so you don't need email confirmation)
5. Click **"Create user"**

### Option B: Via Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/sql
2. Run this SQL (replace with your email and password):
```sql
-- Create admin user
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
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('your-password-here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User","role":"admin"}',
  false,
  '',
  ''
);
```

## Step 2: Test Admin Panel Login

1. **Start the development server:**
   ```bash
   cd admin-panel
   npm run dev
   ```

2. **Open your browser:**
   - Go to: http://localhost:3000

3. **Login:**
   - Enter the email you used when creating the user
   - Enter the password you set
   - Click "Sign In"

4. **You should be redirected to:** http://localhost:3000/dashboard

## Step 3: Test Mobile App Login

1. **Start Expo:**
   ```bash
   cd my-app
   npm start
   ```

2. **On the login screen:**
   - Click "Don't have an account? Sign Up"
   - Enter your email and password
   - Enter your name
   - Click "Sign Up"
   - You'll be automatically signed in

3. **Or sign in if you already have an account:**
   - Enter your email and password
   - Click "Sign In"

## Troubleshooting

### "Invalid email or password" error
- Verify the user exists in Supabase Dashboard > Authentication > Users
- Make sure you're using the correct email and password
- Check that email confirmation is not required (if it is, confirm the email first)

### "Missing Supabase environment variables" error
- Make sure `.env.local` (admin-panel) or `.env` (mobile app) exists
- Restart your development server after creating/modifying env files
- For Next.js: Make sure the file is named `.env.local` (not `.env`)
- For Expo: Make sure variables start with `EXPO_PUBLIC_`

### Can't see the login screen
- Clear browser cache/localStorage
- Check browser console for errors
- Make sure the development server is running

### Mobile app not connecting
- Check that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart Expo after changing `.env` file
- Check Expo logs for connection errors

## Verify Your Setup

Run the test script to verify everything is configured:
```bash
cd admin-panel
node test-supabase.js
```

You should see: `✓ Supabase is configured correctly!`

## Next Steps

Once login works:
1. You can manage users from Supabase Dashboard
2. Users can sign up directly from the mobile app
3. Admin users should have `role: "admin"` in their user metadata for access control

## Security Notes

- Never commit `.env` or `.env.local` files to git
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret (it's already in `.env.local`)
- The anon key is safe to expose in client-side code
- Consider enabling email confirmation in Supabase settings for production

