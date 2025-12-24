import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signUpWithEmail, signInWithEmail, logOut, resetPasswordWithEmail } from '../services/authService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
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
            setLoading(false); // Set loading to false once we have auth state

            // Clean up previous listener if any
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (user) {
                // Subscribe to real-time profile updates
                const userRef = doc(db, 'users', user.uid);
                unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as ProfileData);
                    } else {
                        setUserProfile(null);
                    }
                }, (error) => {
                    console.error("Error listening to user profile:", error);
                });
            } else {
                setUserProfile(null);
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

    // Refresh profile from Firestore (Manual refresh still useful if needed, but listener usually handles it)
    const refreshProfile = async () => {
        // Listener handles this, but we can keep for compatibility or manual triggers
        // if needed. For now, it's a no-op or just logs.
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
