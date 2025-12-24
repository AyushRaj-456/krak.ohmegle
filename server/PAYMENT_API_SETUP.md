# Backend Payment APIs Setup

## ✅ What We've Created

1. **Authentication Middleware** (`middleware/auth.js`)
   - Verifies Firebase tokens
   - Extracts user role (user/admin)
   - Protects routes

2. **Payment Manager** (`managers/PaymentManager.js`)
   - Create payment requests
   - Submit UTR
   - Approve/reject payments
   - Credit tokens automatically

3. **Payment Routes** (`routes/payments.js`)
   - User routes: `/create`, `/submit-utr`, `/my-payments`
   - Admin routes: `/pending`, `/approve`, `/reject`

4. **Updated Server** (`server.js`)
   - Firebase Admin SDK initialized
   - Payment routes registered

---

## 🔧 Setup Required

### Step 1: Install Dependencies

```bash
cd d:\SITOmegle\server
npm install
```

This will install `firebase-admin` package.

### Step 2: Get Firebase Service Account Key

1. Go to **Firebase Console** → **Project Settings** (gear icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** (downloads a JSON file)
5. **Rename** the downloaded file to `serviceAccountKey.json`
6. **Move** it to `d:\SITOmegle\server\serviceAccountKey.json`

> ⚠️ **IMPORTANT**: Add `serviceAccountKey.json` to `.gitignore` - never commit this file!

### Step 3: Add to .gitignore

Create/update `d:\SITOmegle\server\.gitignore`:
```
node_modules/
serviceAccountKey.json
.env
```

### Step 4: Create Environment Variables (Optional)

Create `d:\SITOmegle\server\.env`:
```
UPI_ID=yourname@paytm
QR_CODE_URL=https://your-domain.com/qr-code.png
```

### Step 5: Restart Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## 📡 API Endpoints

### User Endpoints

**Create Payment**
```
POST http://localhost:3000/api/payments/create
Headers: { Authorization: "Bearer <firebase_token>" }
Body: { "packageId": "regular_10" }
```

**Submit UTR**
```
POST http://localhost:3000/api/payments/submit-utr
Headers: { Authorization: "Bearer <firebase_token>" }
Body: { 
  "paymentId": "xyz123",
  "utr": "123456789012"
}
```

**Get My Payments**
```
GET http://localhost:3000/api/payments/my-payments
Headers: { Authorization: "Bearer <firebase_token>" }
```

### Admin Endpoints

**Get Pending Payments**
```
GET http://localhost:3000/api/payments/pending
Headers: { Authorization: "Bearer <admin_firebase_token>" }
```

**Approve Payment**
```
POST http://localhost:3000/api/payments/approve
Headers: { Authorization: "Bearer <admin_firebase_token>" }
Body: {
  "paymentId": "xyz123",
  "adminNotes": "Verified in PhonePe"
}
```

**Reject Payment**
```
POST http://localhost:3000/api/payments/reject
Headers: { Authorization: "Bearer <admin_firebase_token>" }
Body: {
  "paymentId": "xyz123",
  "reason": "UTR not found"
}
```

---

## 🧪 Testing with Postman

1. **Get Firebase Token**:
   - Sign in to your web app
   - Open browser console
   - Run: `await firebase.auth().currentUser.getIdToken()`
   - Copy the token

2. **Test Create Payment**:
   - Open Postman
   - POST `http://localhost:3000/api/payments/create`
   - Headers: `Authorization: Bearer <your_token>`
   - Body: `{ "packageId": "regular_10" }`
   - Send

3. **Test Submit UTR**:
   - Use the `paymentId` from previous response
   - POST `http://localhost:3000/api/payments/submit-utr`
   - Body: `{ "paymentId": "...", "utr": "123456789012" }`

4. **Test Admin Routes** (use admin token):
   - GET `/api/payments/pending`
   - POST `/api/payments/approve`

---

## ✅ Backend Ready Checklist

- [ ] `npm install` completed
- [ ] `serviceAccountKey.json` downloaded and placed
- [ ] `.gitignore` updated
- [ ] Server restarted successfully
- [ ] Tested `/create` endpoint with Postman
- [ ] Tested `/submit-utr` endpoint
- [ ] Tested admin endpoints with admin token

Once all checked, backend is ready for **STEP 3: Admin Web App**!
