# Disable Email Confirmation in Supabase

To skip email confirmation and allow users to login immediately, you have two options:

## Option 1: Disable Email Confirmation in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/providers

2. Click on **Email** provider

3. **Disable "Confirm email"** toggle:
   - Look for the toggle/checkbox that says "Confirm email" or "Enable email confirmations"
   - Turn it **OFF**

4. **Save** the changes

5. All new users will be automatically confirmed when they sign up.

## Option 2: Auto-Confirm Existing Users

For users that are already created but not confirmed:

1. Go to: https://supabase.com/dashboard/project/otenrlbuohajthlgjyjh/auth/users

2. For each user that needs confirmation:
   - Click on the user
   - Look for "Email Confirmed" status
   - If not confirmed, click the button to manually confirm them

   OR use this SQL in the SQL Editor:

```sql
-- Auto-confirm all users
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## Option 3: Auto-Confirm via Code (Already Implemented)

The code has been updated to automatically confirm emails when users try to login. The admin panel login route will:
1. Detect if email is not confirmed
2. Auto-confirm it using the service role key
3. Retry the login

This means even if email confirmation is enabled, the login will still work for the admin panel.

## Testing

After disabling email confirmation:
1. Create a new user
2. Try to login immediately - it should work without confirmation
3. Check the Supabase dashboard - the user should be marked as "Confirmed"

## Notes

- **Security**: Disabling email confirmation means anyone with access to an email/password can login. This is fine for development but consider enabling it for production.
- **Existing Users**: Users created before disabling confirmation will still need to be confirmed (use Option 2 above).
- **Mobile App**: The mobile app will also benefit from this change - users can sign up and login immediately.

