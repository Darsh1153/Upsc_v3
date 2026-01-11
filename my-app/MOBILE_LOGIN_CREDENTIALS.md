# Mobile App Login Credentials

## 🔑 Login Options

### Option 1: Use Existing Admin Account

You can use the admin account we created:

- **Email**: `admin@upscprep.com`
- **Password**: `admin123`

### Option 2: Create a New User

The mobile app has a **Sign Up** feature! Here's how:

1. **Open the app** at `localhost:8081`
2. **Click "Don't have an account? Sign Up"**
3. **Fill in:**
   - Name: Your name
   - Email: Your email (e.g., `test@example.com`)
   - Password: Your password
4. **Click "Sign Up"**

The user will be created in Supabase automatically!

### Option 3: Create User via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sfukhupkvsjaqkbiskbj/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. ✅ Check **"Auto Confirm User"** (important!)
5. Then login in the app with those credentials

## 📱 How to Login

1. **Start the app:**
   ```bash
   cd my-app
   npx expo start
   ```

2. **Open in browser/emulator:**
   - Web: http://localhost:8081
   - Scan QR code for mobile device

3. **On the login screen:**
   - Enter email and password
   - Click "Sign In"

## ✅ Quick Test Credentials

**Test User 1 (Admin):**
- Email: `admin@upscprep.com`
- Password: `admin123`

**Create Your Own:**
- Use the "Sign Up" button in the app
- Or create via Supabase Dashboard

## 🆘 Troubleshooting

### "Invalid email or password"
- Verify the user exists in Supabase
- Check "Auto Confirm User" was checked when creating
- Try creating a new user via Sign Up

### "Email not confirmed"
- Go to Supabase Dashboard
- Find the user
- Check "Auto Confirm User" or confirm email manually

### Can't sign up?
- Check Supabase project is active
- Verify email provider is enabled in Supabase
- Check `.env` file has correct Supabase URL and key

---

**The easiest way: Use the Sign Up feature in the app!** 🚀



