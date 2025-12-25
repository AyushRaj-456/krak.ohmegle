import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
let serviceAccount;

try {
    // Try to load from sibling directory (since this script will be in server/scripts/)
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
} catch (error) {
    console.error('❌ Failed to load serviceAccountKey.json. Make sure it exists in the server root.');
    console.error(error);
    process.exit(1);
}

const db = admin.firestore();

// Get emails from command line args
const emails = process.argv.slice(2);

if (emails.length === 0) {
    console.log('Usage: node scripts/setDevBot.js email1@example.com email2@example.com ...');
    process.exit(0);
}

async function setDevBotRole(email) {
    try {
        console.log(`🔍 Looking for user with email: ${email}...`);

        // Find user by email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            console.log(`⚠️ User not found: ${email}`);
            return;
        }

        // Update each found user (should be unique though)
        const updates = snapshot.docs.map(async (doc) => {
            await doc.ref.update({
                role: 'devbot'
            });
            console.log(`✅ Updated role to 'devbot' for user: ${doc.data().name} (${email})`);
        });

        await Promise.all(updates);

    } catch (error) {
        console.error(`❌ Error updating ${email}:`, error);
    }
}

async function main() {
    console.log('🚀 Starting Dev Bot Role Update...');
    for (const email of emails) {
        await setDevBotRole(email);
    }
    console.log('✨ All done!');
    process.exit(0);
}

main();
