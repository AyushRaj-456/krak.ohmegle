import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    limit,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ProfileData } from '../types';

// Create a new user profile in Firestore
export const createUserProfile = async (uid: string, data: Partial<ProfileData>) => {
    try {
        const userRef = doc(db, 'users', uid);

        // Remove undefined fields to prevent Firebase errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        );

        await setDoc(userRef, {
            uid,
            ...cleanData,
            totalCalls: 0, // Initialize total calls
            seasonCalls: 0, // Initialize season calls
            totalTalkTime: 0,
            longestCall: 0,
            stats: {
                genderMatches: {},
                branchMatches: {},
                moodMatches: {},
                hobbyMatches: {}
            },
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
        });
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { user: userSnap.data() as ProfileData, error: null };
        } else {
            return { user: null, error: 'User not found' };
        }
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

// Update user profile
export const updateUserProfile = async (uid: string, data: Partial<ProfileData>) => {
    try {
        const userRef = doc(db, 'users', uid);

        // Remove undefined fields to prevent Firebase errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        );

        await updateDoc(userRef, {
            ...cleanData,
            lastActive: serverTimestamp(),
        });
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

// Update user's last active timestamp
export const updateLastActive = async (uid: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            lastActive: serverTimestamp(),
        });
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

// Find users by gender (for matching)
export const findUsersByGender = async (gender: string) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('gender', '==', gender));
        const querySnapshot = await getDocs(q);

        const users: ProfileData[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as ProfileData);
        });

        return { users, error: null };
    } catch (error: any) {
        return { users: [], error: error.message };
    }
};
// Find user by email
export const findUserByEmail = async (email: string) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { exists: true, error: null };
        } else {
            return { exists: false, error: null };
        }
    } catch (error: any) {
        console.error("Error finding user by email:", error);
        return { exists: false, error: error.message };
    }
};

// Get top users for leaderboard
export const getTopUsers = async (limitCount: number = 10, sortBy: 'totalCalls' | 'seasonCalls' = 'totalCalls') => {
    try {
        const usersRef = collection(db, 'users');

        let q;
        if (sortBy === 'seasonCalls') {
            q = query(
                usersRef,
                where(sortBy, '>', 0), // Only active users for season
                orderBy(sortBy, 'desc'),
                limit(limitCount)
            );
        } else {
            // For overall, fetch recent users regardless of stats to ensure directory listing
            // We order by lastActive if available, or just fetch random valid users
            // Using a simple query without specific orderBy to avoid missing index or field issues
            q = query(
                usersRef,
                limit(50) // Increase limit to show more users
            );
        }
        const querySnapshot = await getDocs(q);

        const users: ProfileData[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as ProfileData);
        });

        // Manual sort if needed for overall
        if (sortBy === 'totalCalls') {
            users.sort((a, b) => (b.totalCalls || 0) - (a.totalCalls || 0));
        }

        return { users, error: null };
    } catch (error: any) {
        return { users: [], error: error.message };
    }
};
