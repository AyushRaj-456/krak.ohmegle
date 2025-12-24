# Firebase Setup Guide for SIT Omegle

This guide will walk you through setting up Firebase for your SIT Omegle application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "SIT-Omegle")
4. (Optional) Enable Google Analytics if you want usage tracking
5. Click **"Create project"** and wait for it to be created
6. Click **"Continue"** when ready

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "SIT Omegle Web")
3. **Check** the box for "Also set up Firebase Hosting" (optional, but recommended)
4. Click **"Register app"**
5. You'll see your Firebase configuration object - **keep this page open**, you'll need these values soon

## Step 3: Enable Firebase Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable the authentication methods you want to use:
   - **Email/Password**: Click on it, toggle "Enable", and click "Save"
   - **Google**: Click on it, toggle "Enable", add a support email, and click "Save"
   - You can add more providers later (Facebook, GitHub, etc.)

## Step 4: Set Up Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** for development (we'll secure it later)
4. Select a Cloud Firestore location (choose one closest to your users, e.g., `asia-south1` for India)
5. Click **"Enable"**

> [!WARNING]
> Test mode allows anyone to read/write to your database. We'll add security rules later, but for now, this is fine for development.

## Step 5: Copy Your Firebase Configuration

Go back to your Firebase project settings:
1. Click the **gear icon** ⚙️ next to "Project Overview" in the left sidebar
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. You should see your web app with a **"Config"** section

Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 6: Add Configuration to Your Project

1. Open the file `d:\SITOmegle\client\.env.local` (I'll create this template for you)
2. Replace the placeholder values with your actual Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

> [!IMPORTANT]
> The `.env.local` file is already added to `.gitignore`, so your credentials won't be committed to version control.

## Step 7: Install Firebase Dependencies

Run this command in your `client` directory:

```bash
npm install firebase
```

## Step 8: Start Your Application

After adding your Firebase credentials and installing dependencies, start your application:

```bash
npm run dev
```

## Next Steps

Once Firebase is set up, you can:
- Implement user authentication (sign up, sign in, sign out)
- Store user profiles in Firestore
- Add real-time features using Firestore listeners
- Implement chat history storage
- Add user preferences and settings

## Troubleshooting

### "Firebase: Error (auth/api-key-not-valid)"
- Double-check that you copied the API key correctly
- Make sure there are no extra spaces in your `.env.local` file
- Restart your development server after changing `.env.local`

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add `localhost` to the authorized domains list

### Database permission errors
- Make sure you started Firestore in "test mode"
- Check your Firestore rules in Firebase Console → Firestore Database → Rules

## Security Notes

> [!CAUTION]
> Before deploying to production:
> 1. Update Firestore security rules to restrict access
> 2. Add proper authentication checks
> 3. Set up authorized domains in Firebase Console
> 4. Consider upgrading from test mode to production mode with proper rules

---

**Need help?** Check the [Firebase Documentation](https://firebase.google.com/docs) or ask me for assistance!
