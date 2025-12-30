# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the UPSC Prep application.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY` - keep this secret!)

## Step 2: Configure Admin Panel Environment Variables

Create a `.env.local` file in the `admin-panel` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Step 3: Configure Mobile App Environment Variables

Create a `.env` file in the `my-app` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 4: Set Up Authentication in Supabase

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Enable **Email** provider (it should be enabled by default)
3. Configure email settings as needed

## Step 5: Create Admin User

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click **Add user** > **Create new user**
3. Enter an email and password for your admin account
4. Optionally, you can add user metadata by clicking on the user and adding:
   ```json
   {
     "role": "admin",
     "name": "Admin User"
   }
   ```

## Step 6: Test the Setup

### Admin Panel
1. Start the admin panel: `cd admin-panel && npm run dev`
2. Navigate to `http://localhost:3000`
3. Login with the admin credentials you created in Step 5

### Mobile App
1. Start the mobile app: `cd my-app && npm start`
2. Open the app on your device/emulator
3. You can now sign up or sign in with email/password

## Notes

- The admin panel uses Supabase authentication with service role key for server-side operations
- The mobile app uses Supabase client-side authentication
- User sessions are automatically managed by Supabase
- Passwords are securely hashed and stored by Supabase
- Email verification can be enabled/disabled in Supabase settings

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure you've created `.env.local` (admin panel) or `.env` (mobile app) files
- Verify that the environment variable names are correct
- Restart your development server after adding environment variables

### Authentication not working
- Check that your Supabase project URL and keys are correct
- Verify that Email provider is enabled in Supabase dashboard
- Check the browser/device console for error messages

### Can't login with admin account
- Make sure you've created the user in Supabase dashboard
- Verify the email and password are correct
- Check that the user exists in Supabase Authentication > Users

