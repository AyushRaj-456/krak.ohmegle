import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signUpWithEmail, signInWithEmail, logOut, resetPasswordWithEmail } from '../services/authService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { ProfileData } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userProfile: ProfileData | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to auth state changes and subscribe to profile
    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = onAuthChange(async (user) => {
            setCurrentUser(user);
            // Don't set loading false yet. Wait until we decide if we have a profile.

            // Clean up previous listener if any
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (user) {
                console.log("[AuthContext] User Detected:", user.uid, "Anonymous:", user.isAnonymous);
                // Check for Guest
                // Check both the passed user object and the global auth object to be sure
                if (user.isAnonymous || auth.currentUser?.isAnonymous) {
                    console.log("[AuthContext] Setting mock guest profile");
                    setUserProfile({
                        uid: user.uid,
                        name: 'Guest User',
                        branch: 'Guest',
                        year: '1st Year',
                        gender: 'Other',
                        email: '',
                        isGuest: true,
                        totalCalls: 0,
                        seasonCalls: 0,
                        totalTalkTime: 0,
                        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
                        lastActive: { seconds: Date.now() / 1000, nanoseconds: 0 },
                        stats: {
                            genderMatches: {},
                            branchMatches: {},
                            moodMatches: {},
                            hobbyMatches: {}
                        },
                        tokens: { // Mock tokens for guest
                            freeTrialsRemaining: 5,
                            regularTokens: 0,
                            goldenTokens: 0
                        }
                    } as any);
                    setLoading(false);
                    return;
                }

                // Subscribe to real-time profile updates
                const userRef = doc(db, 'users', user.uid);
                unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as ProfileData);
                    } else {
                        // User exists in auth but not firestore (e.g. half-created account)
                        setUserProfile(null);
                    }
                    setLoading(false); // Set loading false after getting profile
                }, (error) => {
                    console.error("Error listening to user profile:", error);
                    setLoading(false); // Ensure loading stops even on error
                });
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    // Sign up function
    const signUp = async (email: string, password: string) => {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
            return { error };
        }
        return { error: null };
    };

    // Sign in function
    const signIn = async (email: string, password: string) => {
        const { error } = await signInWithEmail(email, password);
        if (error) {
            return { error };
        }
        return { error: null };
    };

    // Sign out function
    const signOutUser = async () => {
        await logOut();
        setUserProfile(null);
    };

    // Reset password function
    const resetPassword = async (email: string) => {
        const { error } = await resetPasswordWithEmail(email);
        return { error };
    };

    // Refresh profile from Firestore
    const refreshProfile = async () => {
        console.log("Profile refresh requested (handled by realtime listener)");
    };

    const value = {
        currentUser,
        userProfile,
        loading,
        signUp,
        signIn,
        signOut: signOutUser,
        resetPassword,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
