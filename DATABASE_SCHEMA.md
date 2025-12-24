# Firestore Database Schema

## Collection: `users`

**Purpose**: Store user profiles and token balances

**Document ID**: Firebase Auth UID

**Fields**:
```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,            // User email
  name: string,             // Full name
  branch: string,           // CSE, IT, ECE, etc.
  gender: string,           // Male, Female, Other
  year: string,             // 1st Year, 2nd Year, etc.
  bio: string,              // Optional bio
  hobbies: string[],        // Optional hobbies
  languages: string[],      // Optional languages
  role: string,             // "user" or "admin"
  
  // Token balance
  tokens: {
    freeTrialsRemaining: number,
    regularTokens: number,
    goldenTokens: number
  },
  
  // Timestamps
  createdAt: timestamp,
  lastActive: timestamp
}
```

**Indexes**: None required (queries by UID)

---

## Collection: `payments`

**Purpose**: Track all payment requests and their status

**Document ID**: Auto-generated

**Fields**:
```javascript
{
  // Payment identification
  paymentId: string,        // Same as document ID
  
  // User information
  userId: string,           // Firebase Auth UID
  userName: string,         // For admin convenience
  userEmail: string,        // For admin convenience
  
  // Package details
  packageId: string,        // "regular_10", "regular_30", "golden_5"
  packageName: string,      // "10 Regular Tokens"
  amount: number,           // Price in rupees (20 or 50)
  tokenType: string,        // "regular" or "golden"
  tokenAmount: number,      // Number of tokens (10, 30, or 5)
  
  // Payment details
  utr: string,              // 12-digit UTR number (submitted by user)
  
  // Status tracking
  status: string,           // "pending" | "approved" | "rejected" | "expired"
  
  // Timestamps
  createdAt: timestamp,     // When payment was initiated
  submittedAt: timestamp,   // When UTR was submitted (null until submitted)
  expiresAt: timestamp,     // createdAt + 10 minutes
  processedAt: timestamp,   // When admin approved/rejected (null until processed)
  
  // Admin details
  processedBy: string,      // Admin UID who processed (null until processed)
  adminNotes: string,       // Optional notes from admin
  
  // Metadata (for security/debugging)
  ipAddress: string,        // User's IP address
  userAgent: string         // Browser info
}
```

**Required Indexes**:

1. **Query pending payments by admin**:
   - Collection: `payments`
   - Fields: `status` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

2. **Query user's payments**:
   - Collection: `payments`
   - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

3. **Check UTR uniqueness**:
   - Collection: `payments`
   - Fields: `utr` (Ascending), `status` (Ascending)
   - Query scope: Collection

**To create these indexes in Firebase Console**:
1. Go to Firestore Database
2. Click "Indexes" tab
3. Click "Create Index"
4. Add the fields as specified above

---

## Sample Data

### Sample User (Regular)
```javascript
{
  uid: "abc123xyz",
  email: "john@example.com",
  name: "John Doe",
  branch: "CSE",
  gender: "Male",
  year: "2nd Year",
  role: "user",
  tokens: {
    freeTrialsRemaining: 3,
    regularTokens: 10,
    goldenTokens: 0
  },
  createdAt: "2025-12-15T10:00:00Z",
  lastActive: "2025-12-15T18:00:00Z"
}
```

### Sample User (Admin)
```javascript
{
  uid: "admin_uid_123",
  email: "admin@sitomegle.com",
  name: "Admin User",
  branch: "CSE",
  gender: "Male",
  year: "Graduate",
  role: "admin",  // ← This is the key field
  tokens: {
    freeTrialsRemaining: 999,
    regularTokens: 999,
    goldenTokens: 999
  },
  createdAt: "2025-12-15T10:00:00Z",
  lastActive: "2025-12-15T18:00:00Z"
}
```

### Sample Payment (Pending)
```javascript
{
  paymentId: "pay_xyz789",
  userId: "abc123xyz",
  userName: "John Doe",
  userEmail: "john@example.com",
  packageId: "regular_10",
  packageName: "10 Regular Tokens",
  amount: 20,
  tokenType: "regular",
  tokenAmount: 10,
  utr: "123456789012",
  status: "pending",
  createdAt: "2025-12-15T18:00:00Z",
  submittedAt: "2025-12-15T18:02:00Z",
  expiresAt: "2025-12-15T18:10:00Z",
  processedAt: null,
  processedBy: null,
  adminNotes: null,
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

### Sample Payment (Approved)
```javascript
{
  paymentId: "pay_xyz789",
  userId: "abc123xyz",
  userName: "John Doe",
  userEmail: "john@example.com",
  packageId: "regular_10",
  packageName: "10 Regular Tokens",
  amount: 20,
  tokenType: "regular",
  tokenAmount: 10,
  utr: "123456789012",
  status: "approved",  // ← Changed
  createdAt: "2025-12-15T18:00:00Z",
  submittedAt: "2025-12-15T18:02:00Z",
  expiresAt: "2025-12-15T18:10:00Z",
  processedAt: "2025-12-15T18:05:00Z",  // ← Added
  processedBy: "admin_uid_123",  // ← Added
  adminNotes: "Verified in PhonePe",  // ← Added
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

---

## How to Set Up

### Step 1: Deploy Security Rules
```bash
# In your project root
firebase deploy --only firestore:rules
```

### Step 2: Create Indexes
Go to Firebase Console → Firestore → Indexes and create the 3 indexes listed above.

Or use this command:
```bash
firebase deploy --only firestore:indexes
```

### Step 3: Create Admin User
Run this in Firebase Console or via script:
```javascript
// In Firebase Console → Authentication
// Create a new user with email/password

// Then in Firestore → users collection
// Create document with admin's UID:
{
  uid: "admin_uid_from_auth",
  email: "admin@sitomegle.com",
  name: "Admin",
  role: "admin",  // ← Important!
  // ... other fields
}
```

---

## Database Ready Checklist

- [ ] Security rules deployed
- [ ] Indexes created (3 total)
- [ ] Admin user created with role="admin"
- [ ] Test user created with role="user"
- [ ] Verified admin can access admin routes
- [ ] Verified user cannot access admin routes
