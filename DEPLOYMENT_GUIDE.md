# 🚀 Expo EAS Build Deployment Guide

## ✅ Setup Complete

Your Expo app is now configured with EAS Build:
- **Project ID**: `803e65df-9ace-4c9a-a86b-6359aff78142`
- **Owner**: `clickus`
- **EAS CLI**: Installed ✅
- **expo-dev-client**: Installed ✅

---

## 🐛 Current Issue

The build is failing due to system cache files (Library folder) being detected by git. This is a common issue on macOS.

---

## 🔧 Solution Options

### Option 1: Clean Build from Different Location (Recommended)

1. **Clone the repository to a fresh location**:
```bash
cd ~/Desktop
git clone <your-repo-url> upsc-app-clean
cd upsc-app-clean/my-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build with EAS**:
```bash
eas build --profile development --platform android
```

### Option 2: Use EAS Build Web Interface

1. Go to https://expo.dev/accounts/clickus/projects/upsc-prep
2. Click "Builds" in the sidebar
3. Click "Create a build"
4. Select:
   - Platform: Android
   - Profile: development
5. Click "Build"

The web interface will build from your git repository, avoiding local cache issues.

### Option 3: Build Locally (If you have Android Studio)

```bash
# Start development server
npm start

# In another terminal, build locally
npx expo run:android
```

---

## 📱 Testing the App

Once the build completes, you'll get a download link for the APK.

### Install on Android Device:

1. **Download the APK** from the EAS build page
2. **Transfer to your Android device**
3. **Enable "Install from Unknown Sources"** in Settings
4. **Install the APK**
5. **Open the app**

### Connect to Development Server:

1. Make sure your phone and computer are on the same network
2. In the app, shake your device to open the developer menu
3. Enter your computer's IP address: `192.168.172.219:8082`

---

## 🌐 Alternative: Test on Web (No Build Required)

The easiest way to test right now:

```bash
# Already running on:
http://localhost:8082
```

Open this in your browser to test all features including the new essay evaluation!

---

## 📊 Build Status Commands

```bash
# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Cancel a build
eas build:cancel
```

---

## 🔑 Environment Variables for Production

When you're ready to deploy to production, add these secrets to EAS:

```bash
# Add environment variables
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-value"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-value"
eas secret:create --scope project --name EXPO_PUBLIC_OPENROUTER_API_KEY --value "your-value"
```

---

## 📦 Build Profiles

Your `eas.json` has three profiles:

### 1. Development (Current)
```bash
eas build --profile development --platform android
```
- Creates APK for testing
- Includes dev tools
- Faster builds

### 2. Preview
```bash
eas build --profile preview --platform android
```
- Production-like build
- APK format
- For internal testing

### 3. Production
```bash
eas build --profile production --platform android
```
- App Bundle (AAB)
- Ready for Google Play Store
- Optimized and minified

---

## 🎯 Next Steps

1. **For immediate testing**: Use the web version at http://localhost:8082
2. **For mobile testing**: Try Option 2 (EAS Build Web Interface)
3. **For production**: Set up environment variables and build production profile

---

## 📱 Current Running Services

| Service | URL | Status |
|---------|-----|--------|
| Mobile App (Web) | http://localhost:8082 | ✅ Running |
| Admin Panel | http://localhost:3000 | ✅ Running |
| Essay API | http://localhost:3000/api/mobile/essay/evaluate | ✅ Ready |

---

## 🧪 Test the Essay Feature Now

You can test the essay evaluation feature right now on web:

1. Open http://localhost:8082
2. Navigate to Essay Screen
3. Write an essay
4. Get AI-powered feedback!

No build required! 🎉

---

## 💡 Troubleshooting

### Build fails with "Library" files
- Use Option 2 (Web Interface) - it builds from git, not local files
- Or clone to a fresh directory without system caches

### Can't access on phone
- Make sure phone and computer are on same WiFi
- Check firewall settings
- Try using Expo Go app instead of development build

### Environment variables not working
- Use `eas secret:create` for sensitive values
- Don't commit `.env` files to git
- Restart build after adding secrets

---

**Your app is ready to test on web right now!** 🚀

For mobile builds, use the EAS web interface to avoid local cache issues.
