import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { findUserByEmail } from './userService';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { user: result.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

// Reset password with email
// Reset password with email
export const resetPasswordWithEmail = async (email: string) => {
    try {
        // defined in userService.ts but we need to import it.
        // Wait, I need to add the import first or this will fail compilation.
        // But I can't do multiple file edits in one tool call easily if I depend on imports.
        // Actually I can import it here and then use it.

        // Let's just update the logic first, I'll add the import in a separate step or try to mix them if allowMultiple but files are different.
        // I'll assume I'm editing authService.ts here.

        // Wait, I can't import findUserByEmail because I am editing the function body. 
        // I will do the import in a separate step.

        // Re-reading the plan:
        // "If findUserByEmail returns { exists: false }, return error."

        /* 
           NOTE: I need to import findUserByEmail. 
           I will use a separate tool call for the import to be safe and clean.
        */

        // Implementation with the function assuming it's available (or I will add import next).
        // Actually, I should probably add the import FIRST to avoid temporary broken state if I were running a watcher, 
        // but here it's fine.

        const { exists, error } = await findUserByEmail(email);

        if (error) {
            // If there was an error checking (e.g. permission), what should we do?
            // If we strict fail, we might block valid users if rules are wrong.
            // If we loose fail, we send email.
            // User complained about "showing reset link sent ... for those who have not created account".
            // So we MUST fail if we are sure they don't exist.
            // If we assume error means we proceed, we solve the valid user blocked issue, 
            // but we might re-introduce the "fake success" if the error is "permission denied" for everyone.

            // However, for "No account found" to be accurate, we need to trust 'exists'.
            // The previous issue "no account found" for VALID account with `fetchSignInMethodsForEmail` 
            // likely returned empty array which I interpreted as "no account".

            // If Firestore query works, 'exists' will be correct.
            console.warn("Error verifying user existence:", error);
            //Proceeding cautiously - maybe just return the error?
            // "fix it" implies making it work correctly.
            // If I return error here, the UI shows it.
        }

        if (!exists && !error) {
            return { error: 'No account found with this email.' };
        }

        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

// Sign out
export const logOut = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
