import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserProfile, updateUserProfile, checkUsernameAvailability } from '../services/userService';
import type { ProfileData } from '../types';

interface ProfileSetupProps {
    onComplete: (profile: ProfileData) => void;
    onClose?: () => void;
    initialData?: ProfileData;
    isEdit?: boolean;
}

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER'];
const GENDERS = ['Male', 'Female', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];
// Languages list moved to state initialization or removed if not needed to be a constant for now

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onClose, initialData, isEdit = false }) => {
    const { currentUser, refreshProfile, updateLocalProfile } = useAuth();
    const [name, setName] = useState(initialData?.name || '');
    const [branch, setBranch] = useState(initialData?.branch || BRANCHES[0]);
    const [gender, setGender] = useState(initialData?.gender || GENDERS[0]);
    const [year, setYear] = useState(initialData?.year || YEARS[0]);
    const [bio, setBio] = useState(initialData?.bio || '');
    const [hobbiesInput, setHobbiesInput] = useState(initialData?.hobbies?.join(', ') || '');
    const [languagesInput, setLanguagesInput] = useState(initialData?.languages?.join(', ') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            setError('No user logged in');
            return;
        }

        if (name.trim()) {
            setLoading(true);
            setError('');

            // Check if username is taken (skip check if editing and name hasn't changed)
            if (!isEdit || (isEdit && initialData?.name !== name)) {
                const { available, error: checkError } = await checkUsernameAvailability(name, currentUser.uid);

                if (checkError) {
                    setError('Error checking username availability');
                    setLoading(false);
                    return;
                }

                if (!available) {
                    setError(`Warning: The name "${name}" is already taken. Please choose another one.`);
                    setLoading(false);
                    return;
                }
            }

            // Start GUEST Logic
            // If user is guest, skip username check and Firestore write
            if (currentUser.isAnonymous || initialData?.isGuest) {
                const profileData: ProfileData = {
                    uid: currentUser.uid,
                    email: '', // Guests don't have email
                    name,
                    branch,
                    gender,
                    year,
                    bio: bio.trim() || undefined,
                    hobbies: hobbiesInput.trim() ? hobbiesInput.split(',').map(h => h.trim()).filter(h => h) : undefined,
                    languages: languagesInput.trim() ? languagesInput.split(',').map(l => l.trim()).filter(l => l) : undefined,
                    isGuest: true,
                    // Preserve existing guest stats if any
                    ...initialData
                };

                // Override new values on top of initialData to ensure updates stick
                // Specifically re-assign the form values we just captured
                Object.assign(profileData, {
                    name,
                    branch,
                    gender,
                    year,
                    bio: bio.trim() || undefined,
                    hobbies: hobbiesInput.trim() ? hobbiesInput.split(',').map(h => h.trim()).filter(h => h) : undefined,
                    languages: languagesInput.trim() ? languagesInput.split(',').map(l => l.trim()).filter(l => l) : undefined
                });

                // Update local context
                updateLocalProfile(profileData);
                setLoading(false);
                onComplete(profileData);
                return;
            }
            // End GUEST Logic

            const profileData: ProfileData = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                name,
                branch,
                gender,
                year,
                bio: bio.trim() || undefined,
                hobbies: hobbiesInput.trim() ? hobbiesInput.split(',').map(h => h.trim()).filter(h => h) : undefined,
                languages: languagesInput.trim() ? languagesInput.split(',').map(l => l.trim()).filter(l => l) : undefined
            };

            // Save or update profile in Firestore
            const result = isEdit
                ? await updateUserProfile(currentUser.uid, profileData)
                : await createUserProfile(currentUser.uid, profileData);

            setLoading(false);

            if (result.error) {
                setError(result.error);
            } else {
                // Refresh profile in AuthContext
                await refreshProfile();
                onComplete(profileData);
            }
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-[#0a0a0f] p-6 overflow-hidden">
            {/* Subtle blurred background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Profile Setup card */}
            <div className="relative w-full max-w-md bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl">
                {/* Close Button (Only in Edit Mode) */}
                {isEdit && onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-wider font-mono flex items-center justify-center">
                        krak.Ωegle
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isEdit ? 'Edit your profile' : 'Complete your profile to continue'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Full Name Input */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Branch */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                required
                                disabled={loading}
                            >
                                {BRANCHES.map(b => <option key={b} value={b} className="bg-[#16161d]">{b}</option>)}
                            </select>
                        </div>

                        {/* Gender */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                required
                                disabled={loading}
                            >
                                {GENDERS.map(g => <option key={g} value={g} className="bg-[#16161d]">{g}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Year */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Year <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            required
                            disabled={loading}
                        >
                            {YEARS.map(y => <option key={y} value={y} className="bg-[#16161d]">{y}</option>)}
                        </select>
                    </div>

                    {/* Bio */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Bio (Optional)
                        </label>
                        <textarea
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10 resize-none"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a bit about yourself..."
                            rows={3}
                            maxLength={200}
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-600 mt-1">{bio.length}/200 characters</p>
                    </div>

                    {/* Hobbies and Languages - Horizontal Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Hobbies */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                Hobbies (Optional)
                            </label>
                            <input
                                className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                                value={hobbiesInput}
                                onChange={(e) => setHobbiesInput(e.target.value)}
                                placeholder="e.g., Reading, Gaming"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-600 mt-1">Comma-separated</p>
                        </div>

                        {/* Languages */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-blue-400 transition-colors duration-200">
                                Languages (Optional)
                            </label>
                            <input
                                className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                                value={languagesInput}
                                onChange={(e) => setLanguagesInput(e.target.value)}
                                placeholder="e.g., English, Hindi"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-600 mt-1">Comma-separated</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3.5 rounded-lg transition-all mt-6 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                {isEdit ? 'Saving...' : 'Creating profile...'}
                            </span>
                        ) : (
                            isEdit ? 'Save Changes' : 'Continue'
                        )}
                    </button>
                </form>

                {!isEdit && (
                    <p className="text-center text-xs text-gray-600 mt-6">
                        Fields marked with <span className="text-red-500">*</span> are required
                    </p>
                )}
            </div>
        </div>
    );
};
