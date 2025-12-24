# Admin Web App Setup

## ✅ Admin App Created!

A completely separate admin web application for secure payment management.

### What's Included

1. **Secure Admin Login** - Only accessible with admin credentials
2. **Pending Payments Dashboard** - View all payments awaiting approval
3. **Approve/Reject Actions** - One-click payment processing
4. **Auto-refresh** - Updates every 30 seconds
5. **Real-time Status** - See payment details instantly

---

## 🔧 Setup Instructions

### Step 1: Copy Firebase Config

Copy your Firebase configuration from the client app:

1. Open `d:\SITOmegle\client\src\firebase.ts`
2. Copy the `firebaseConfig` object
3. Paste it into `d:\SITOmegle\admin\src\firebase.ts`

Replace the placeholder values with your actual Firebase config.

### Step 2: Install Dependencies

```bash
cd d:\SITOmegle\admin
npm install
```

### Step 3: Start Admin App

```bash
npm run dev
```

The admin app will run on **http://localhost:5174** (different port from user app)

---

## 🔐 How to Use

### Login
1. Go to http://localhost:5174
2. Enter your admin email (the one with `role: "admin"` in Firestore)
3. Enter password
4. Click "Sign In"

### Approve Payments
1. You'll see all pending payments
2. Each payment shows:
   - User name and email
   - Package details
   - Amount (₹)
   - **UTR number** (12 digits)
   - Submission time
3. **Verify UTR in your UPI app** (PhonePe/Google Pay/Paytm)
4. If verified, click **"✅ Approve"**
5. Tokens are automatically credited to the user!

### Reject Payments
1. If UTR doesn't match or is invalid
2. Click **"❌ Reject"**
3. Enter rejection reason
4. User will see "Payment Rejected"

---

## 🎯 Security Features

✅ **Separate App** - Completely isolated from user app
✅ **Different Port** - Runs on 5174, user app on 5173
✅ **Admin-Only** - Backend checks `role: "admin"`
✅ **Firebase Auth** - Secure authentication
✅ **No Public Access** - Only you can access this URL

---

## 📱 Admin Dashboard Features

### Stats Card
- Shows total pending payments
- Refresh button to manually update

### Payment Cards
Each payment displays:
- User information
- Package and amount
- UTR number (highlighted)
- Time since submission
- Approve/Reject buttons

### Auto-Refresh
- Dashboard updates every 30 seconds
- Always shows latest payments

---

## 🚀 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Copy Firebase config
3. ✅ Start admin app: `npm run dev`
4. ✅ Login with admin credentials
5. ✅ Test approve/reject flow

Once admin app is running, we can move to **STEP 4: User Payment UI**!
