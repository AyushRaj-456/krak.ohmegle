import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import type { ProfileData, MatchPreferences, UserTokens, MatchType, ServerStats } from '../types';
import { getTopUsers } from '../services/userService';
import { TokenDisplay } from './TokenDisplay';
import { TokenShop } from './TokenShop';
import PaymentNotifications from './PaymentNotifications';
import PaymentHelpModal from './PaymentHelpModal';
import PaymentCautionModal from './PaymentCautionModal';
import DonationModal from './DonationModal';
import DashboardModal from './DashboardModal';

interface HomePageProps {
    profile: ProfileData;
    tokens: UserTokens;
    onEditProfile: () => void;
    onSignOff: () => void;
    onJoinRoom: (preferences: MatchPreferences) => void;
    onBuyTokens: (packageId: string) => void;
    onRefreshTokens: () => void;
    onAlert: (message: string) => void;
}

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER'];
const GENDERS = ['Male', 'Female', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Other'];

type NavSection = 'leaderboard' | 'match' | 'tokens';

export const HomePage: React.FC<HomePageProps> = ({
    profile,
    tokens,
    onEditProfile,
    onSignOff,
    onJoinRoom,
    onBuyTokens,
    onRefreshTokens,
    onAlert // Added onAlert to destructured props
}) => {
    const { socket, isConnected } = useSocket(); // Added isConnected
    const [preferredBranch, setPreferredBranch] = useState<string>('');
    const [preferredGender, setPreferredGender] = useState<string>('');
    const [preferredLanguage, setPreferredLanguage] = useState<string>('');

    const [matchType, setMatchType] = useState<MatchType>('regular');
    const [mood, setMood] = useState(''); // New mood state
    const [showTokenShop, setShowTokenShop] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showCaution, setShowCaution] = useState(false);
    const [showDonation, setShowDonation] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [activeSection, setActiveSection] = useState<NavSection>('match');
    const [stats, setStats] = useState<ServerStats>({ totalUsers: 0, online: 0, idle: 0, onCall: 0, queuing: 0 });
    const [leaderboardUsers, setLeaderboardUsers] = useState<ProfileData[]>([]); // Leaderboard stats
    const [leaderboardType, setLeaderboardType] = useState<'active' | 'overall'>('active');
    const [selectedUserProfile, setSelectedUserProfile] = useState<ProfileData | null>(null);
    const [focusedUser, setFocusedUser] = useState<string | null>(null);
    const [isStatsHovered, setIsStatsHovered] = useState(false);

    const [showPermissionHelp, setShowPermissionHelp] = useState(false);

    // Permission State
    const [cameraAllowed, setCameraAllowed] = useState(false);
    const [micAllowed, setMicAllowed] = useState(false);

    // Check permissions on mount and listen for changes
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                // Check Camera
                const camPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
                setCameraAllowed(camPerm.state === 'granted');
                camPerm.onchange = () => {
                    setCameraAllowed(camPerm.state === 'granted');
                };

                // Check Mic
                const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setMicAllowed(micPerm.state === 'granted');
                micPerm.onchange = () => {
                    setMicAllowed(micPerm.state === 'granted');
                };

            } catch (err) {
                console.error("Error checking permissions:", err);
            }
        };

        checkPermissions();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleStats = (newStats: ServerStats) => {
            setStats(newStats);
        };

        socket.on('server_stats', handleStats);

        return () => {
            socket.off('server_stats', handleStats);
        };
    }, [socket]);

    // Fetch leaderboard when section is active
    useEffect(() => {
        if (activeSection === 'leaderboard') {
            const fetchLeaderboard = async () => {
                const sortBy = leaderboardType === 'active' ? 'seasonCalls' : 'totalCalls';
                const { users } = await getTopUsers(10, sortBy);
                setLeaderboardUsers(users);
            };
            fetchLeaderboard();
        }
    }, [activeSection, leaderboardType]);

    const handleJoinRoom = async () => {
        // Enforce Toggles
        if (!cameraAllowed || !micAllowed) {
            onAlert("⚠️ You must enable both Camera and Microphone access above to join!");
            return;
        }

        // Proceed
        const preferences: MatchPreferences = {
            branch: preferredBranch || undefined,
            gender: preferredGender || undefined,
            language: preferredLanguage || undefined,
            mood: mood || undefined,
            mode: 'video',
            matchType
        };
        onJoinRoom(preferences);
    };

    const handlePurchase = (packageId: string) => {
        onBuyTokens(packageId);
        setShowTokenShop(false);
    };

    const hasTokens = () => {
        return true; // Temporary: Unlimited tokens for everyone
        // if (matchType === 'regular') {
        //     return tokens.freeTrialsRemaining > 0 || tokens.regularTokens > 0;
        // } else if (matchType === 'golden') {
        //     return tokens.goldenTokens > 0;
        // }
        // return false;
    };


    return (
        <div className="relative min-h-screen bg-[#0a0a0f] p-6">
            {/* Subtle background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            {/* Permission Help Modal */}
            {showPermissionHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPermissionHelp(false)}>
                    <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowPermissionHelp(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Enable Camera & Mic</h2>
                            <p className="text-gray-400 text-sm">You need these permissions to chat!</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded text-white">Method 1</span>
                                    Address Bar
                                </h3>
                                <p className="text-sm text-gray-300">
                                    Click the <strong className="text-white">Lock/Settings icon (🔒)</strong> on the left side of your browser's address bar. Toggle Camera & Microphone to <strong className="text-green-400">ON</strong>.
                                </p>
                            </div>

                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="bg-gray-600 text-xs px-2 py-0.5 rounded text-white">Method 2</span>
                                    Browser Settings
                                </h3>
                                <p className="text-sm text-gray-300">
                                    Go to <strong className="text-white">Settings {'>'} Privacy & Security {'>'} Site Settings</strong>. Find this site and select "Reset Permissions" or manually Allow.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPermissionHelp(false)}
                            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            <div className="relative max-w-7xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider font-mono flex items-center">
                        krak.Ωegle
                    </h1>
                    <button
                        onClick={onSignOff}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-600/20 hover:border-red-600/40 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Off
                    </button>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="relative max-w-7xl mx-auto mb-6">
                <div className="bg-[#16161d]/60 backdrop-blur-xl rounded-xl p-2 border border-white/5 grid grid-cols-3 gap-2 relative isolate">
                    {/* Sliding Background */}
                    <div
                        className={`absolute top-2 bottom-2 left-2 w-[calc((100%-32px)/3)] bg-purple-600 rounded-lg shadow-lg shadow-purple-600/30 transition-transform duration-300 ease-out -z-10 ${activeSection === 'leaderboard' ? 'translate-x-0' :
                            activeSection === 'match' ? 'translate-x-[calc(100%+8px)]' :
                                'translate-x-[calc(200%+16px)]'
                            }`}
                    />

                    <button
                        onClick={() => setActiveSection('leaderboard')}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${activeSection === 'leaderboard'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Leaderboard
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveSection('match')}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${activeSection === 'match'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Match Making
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveSection('tokens')}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${activeSection === 'tokens'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Token Shop
                        </div>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto">

                {/* Leaderboard Section */}
                {activeSection === 'leaderboard' && (
                    <div className="bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <svg className="w-7 h-7 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                Leaderboard
                            </h2>
                            <span className="text-sm text-gray-400 transition-all duration-300">
                                {leaderboardType === 'active' ? 'Bi-weekly Leaderboard (Active Users)' : 'Overall Standing (All Users)'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {/* Leaderboard Toggle */}
                            <div className="relative flex bg-[#0f0f14] p-1 rounded-lg border border-white/5 mb-4 isolate">
                                {/* Sliding Background */}
                                <div
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-purple-600 rounded-md shadow-lg shadow-purple-600/20 transition-all duration-300 ease-out -z-10 ${leaderboardType === 'active' ? 'left-1' : 'left-[calc(50%+2px)]'
                                        }`}
                                />

                                <button
                                    onClick={() => setLeaderboardType('active')}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${leaderboardType === 'active'
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Active Users (Bi-weekly)
                                </button>
                                <button
                                    onClick={() => setLeaderboardType('overall')}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${leaderboardType === 'overall'
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Overall Standing
                                </button>
                            </div>

                            <div className="space-y-3 transition-all duration-300 ease-in-out" key={leaderboardType}>
                                {leaderboardUsers.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10">
                                        No ranked users yet. Be the first!
                                    </div>
                                ) : (
                                    leaderboardUsers.map((user, idx) => {
                                        const rank = idx + 1;
                                        let reward = null;

                                        if (leaderboardType === 'active') {
                                            if (rank === 1) reward = '6 Free Trials';
                                            else if (rank === 2) reward = '4 Free Trials';
                                            else if (rank === 3) reward = '2 Free Trials';
                                        }

                                        const renderMedal = (r: number) => {
                                            if (r === 1) return <span className="text-3xl">🥇</span>;
                                            if (r === 2) return <span className="text-3xl">🥈</span>;
                                            if (r === 3) return <span className="text-3xl">🥉</span>;
                                            return null;
                                        };

                                        return (
                                            <div
                                                key={user.uid || idx}
                                                onClick={() => {
                                                    if (user.uid) {
                                                        setFocusedUser(focusedUser === user.uid ? null : user.uid);
                                                    }
                                                }}
                                                className={`relative flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${rank <= 3
                                                    ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30'
                                                    : 'bg-[#0f0f14] border border-white/5 hover:border-purple-500/30'
                                                    } ${focusedUser === user.uid ? 'ring-2 ring-purple-500/50 scale-[1.02]' : ''}`}
                                            >
                                                {/* View Profile Overlay Button */}
                                                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 ${focusedUser === user.uid ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                                                    }`}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedUserProfile(user);
                                                        }}
                                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-600/30 transform transition-transform hover:scale-105 flex items-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View Profile
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 flex justify-center">
                                                        {renderMedal(rank)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-lg font-bold ${rank <= 3 ? 'text-yellow-400' : 'text-gray-300'
                                                                }`}>
                                                                #{rank}
                                                            </span>
                                                            <span className="text-white font-medium">{user.name}</span>
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {leaderboardType === 'active'
                                                                ? `${user.seasonCalls || 0} calls this season`
                                                                : `${user.totalCalls || 0} completed calls`}
                                                        </span>
                                                        {reward && (
                                                            <div className="mt-1 flex items-center gap-1">
                                                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                                <span className="text-xs font-medium text-green-400">Reward: {reward}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-purple-400">
                                                        {leaderboardType === 'active' ? (user.seasonCalls || 0) : (user.totalCalls || 0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">calls</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <div>
                                            <span className="text-white font-medium">Your Rank: </span>
                                            <span className={`font-bold ${
                                                // Calculate rank if user is in the loaded list
                                                leaderboardUsers.findIndex(u => u.uid === profile.uid) !== -1
                                                    ? 'text-purple-400'
                                                    : 'text-gray-500' // Visual cue for unranked
                                                }`}>
                                                {(() => {
                                                    const idx = leaderboardUsers.findIndex(u => u.uid === profile.uid);
                                                    if (idx !== -1) {
                                                        return `#${idx + 1}`;
                                                    }
                                                    return (leaderboardType === 'active' ? (profile.seasonCalls || 0) : (profile.totalCalls || 0)) > 0 ? "Unranked" : "Unranked (Inactive)";
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white">
                                            {leaderboardType === 'active' ? (profile.seasonCalls || 0) : (profile.totalCalls || 0)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {leaderboardType === 'active' ? 'calls this season' : 'completed calls'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Token Shop Section */}
                {activeSection === 'tokens' && (
                    <div className="max-w-2xl mx-auto">
                        <TokenDisplay
                            tokens={tokens}
                            onBuyTokens={() => setShowTokenShop(true)}
                            onShowNotifications={() => setShowNotifications(true)}
                            onRefresh={onRefreshTokens}
                            onAlert={onAlert}
                        />
                        <div className="mt-6 bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl text-center">
                            <h3 className="text-xl font-bold text-white mb-3">Need More Tokens?</h3>
                            <p className="text-gray-400 mb-4">Purchase tokens to continue chatting with other students</p>
                            <button
                                onClick={() => onAlert("Payment option is on hold for now... currently tokens are free!")}
                                className="px-6 py-3 bg-purple-600/50 text-white/50 font-medium rounded-lg transition-all shadow-lg shadow-purple-600/10 cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                                style={{ filter: 'blur(1px)' }}
                            >
                                🔒 Open Token Shop
                            </button>
                            <div className="flex justify-center flex-wrap gap-4 mt-4">
                                <p
                                    onClick={() => setShowHelp(true)}
                                    className="text-[#8b5cf6] hover:text-[#7c3aed] text-sm cursor-pointer hover:underline transition-colors font-medium"
                                >
                                    ❓ How the payment works?
                                </p>
                                <p
                                    onClick={() => setShowCaution(true)}
                                    className="text-[#fbbf24] hover:text-[#fcd34d] text-sm cursor-pointer hover:underline transition-colors font-medium"
                                >
                                    ⚠️ What you should take care of
                                </p>
                                <p
                                    onClick={() => setShowDonation(true)}
                                    className="text-[#ec4899] hover:text-[#db2777] text-sm cursor-pointer hover:underline transition-colors font-medium flex items-center gap-1"
                                >
                                    Support with a cup of tea
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Match Making Section */}
                {activeSection === 'match' && (
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Profile Card */}
                        <div className={`bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl transition-all duration-500 ease-in-out ${isStatsHovered ? 'lg:flex-[0.8]' : 'lg:flex-1'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                                {profile.email && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f0f14] rounded-full border border-white/5">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span className="text-xs text-gray-500 font-mono">{profile.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg">
                                    <span className="text-gray-400 text-sm">Name</span>
                                    <span className="text-white font-medium">{profile.name}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg">
                                    <span className="text-gray-400 text-sm">Branch</span>
                                    <span className="text-white font-medium">{profile.branch}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg">
                                    <span className="text-gray-400 text-sm">Gender</span>
                                    <span className="text-white font-medium">{profile.gender}</span>
                                </div>
                                {profile.year && (
                                    <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg">
                                        <span className="text-gray-400 text-sm">Year</span>
                                        <span className="text-white font-medium">{profile.year}</span>
                                    </div>
                                )}
                                {profile.bio && (
                                    <div className="p-3 bg-[#0f0f14] rounded-lg">
                                        <span className="text-gray-400 text-sm block mb-2">Bio</span>
                                        <p className="text-white text-sm">{profile.bio}</p>
                                    </div>
                                )}
                                {(profile.hobbies && profile.hobbies.length > 0) || (profile.languages && profile.languages.length > 0) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {profile.hobbies && profile.hobbies.length > 0 && (
                                            <div className="p-3 bg-[#0f0f14] rounded-lg">
                                                <span className="text-gray-400 text-sm block mb-2">Hobbies</span>
                                                <div className="flex flex-col gap-2">
                                                    {profile.hobbies.map((hobby, idx) => (
                                                        <span key={idx} className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full border border-purple-600/30 w-fit">
                                                            {hobby}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {profile.languages && profile.languages.length > 0 && (
                                            <div className="p-3 bg-[#0f0f14] rounded-lg">
                                                <span className="text-gray-400 text-sm block mb-2">Languages</span>
                                                <div className="flex flex-col gap-2">
                                                    {profile.languages.map((language, idx) => (
                                                        <span key={idx} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full border border-blue-600/30 w-fit">
                                                            {language}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            <button
                                onClick={onEditProfile}
                                className="w-full bg-[#0f0f14] hover:bg-[#1a1a24] text-white font-medium py-2.5 rounded-lg transition-all border border-white/5 hover:border-purple-500/50"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setShowDashboard(true)}
                                className="w-full bg-[#0f0f14] hover:bg-[#1a1a24] text-white font-medium py-2.5 rounded-lg transition-all border border-white/5 hover:border-blue-500/50 mt-3 flex items-center justify-center gap-2"
                            >
                                <span>📊</span> Dashboard
                            </button>

                            {/* Permission Toggles */}
                            <div className="mt-4 space-y-3 bg-[#0f0f14] p-4 rounded-xl border border-white/5 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-400">Device Permissions</h3>
                                    <button
                                        onClick={() => setShowPermissionHelp(true)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        title="Need Help?"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </button>
                                </div>

                                {/* Camera Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${cameraAllowed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-medium">Camera Access</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!cameraAllowed) {
                                                try {
                                                    await navigator.mediaDevices.getUserMedia({ video: true });
                                                } catch (err) {
                                                    onAlert("⚠️ Camera permission denied. Please allow it in settings.");
                                                }
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${cameraAllowed
                                            ? 'bg-green-500/20 text-green-400 cursor-default'
                                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}
                                    >
                                        {cameraAllowed ? 'ON' : 'OFF'}
                                    </button>
                                </div>

                                {/* Mic Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${micAllowed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <span className="text-white font-medium">Microphone Access</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!micAllowed) {
                                                try {
                                                    await navigator.mediaDevices.getUserMedia({ audio: true });
                                                } catch (err) {
                                                    onAlert("⚠️ Microphone permission denied. Please allow it in settings.");
                                                }
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${micAllowed
                                            ? 'bg-green-500/20 text-green-400 cursor-default'
                                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            }`}
                                    >
                                        {micAllowed ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>

                            <p
                                onClick={() => setShowDonation(true)}
                                className="text-[#ec4899] hover:text-[#db2777] text-sm cursor-pointer hover:underline transition-colors font-medium flex items-center justify-center gap-1 mt-4"
                            >
                                Support with a cup of tea
                            </p>
                        </div>


                        {/* Match Preferences Card */}
                        <div className={`bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl transition-all duration-500 ease-in-out ${isStatsHovered ? 'lg:flex-[1.4]' : 'lg:flex-1'}`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                                <h2 className="text-2xl font-bold text-white">Match Preferences</h2>
                                <div
                                    onMouseEnter={() => setIsStatsHovered(true)}
                                    onMouseLeave={() => setIsStatsHovered(false)}
                                    className="group flex items-center gap-3 bg-[#0f0f14]/80 px-3 py-1.5 rounded-full border border-white/5 hover:border-purple-500/30 transition-all duration-500 ease-out hover:shadow-lg hover:shadow-purple-900/20 cursor-pointer w-fit self-start lg:self-auto overflow-x-auto max-w-full no-scrollbar"
                                >
                                    {/* Total Users */}
                                    <div className="flex items-center gap-2" title="Total Registered Users">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                        <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-500 ease-in-out delay-0 group-hover:delay-300">
                                            <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mr-1.5">Total:</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white">{stats.totalUsers}</span>
                                    </div>

                                    {/* Online Users */}
                                    <div className="flex items-center gap-2" title="Online Users">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                        <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-500 ease-in-out delay-0 group-hover:delay-300">
                                            <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mr-1.5">Online:</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white">{stats.online}</span>
                                    </div>

                                    {/* On Call */}
                                    <div className="flex items-center gap-2" title="Users On Call">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                        <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-500 ease-in-out delay-0 group-hover:delay-300">
                                            <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mr-1.5">On Call:</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white">{stats.onCall}</span>
                                    </div>

                                    {/* Idle Users */}
                                    <div className="flex items-center gap-2" title="Idle Users">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
                                        <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-500 ease-in-out delay-0 group-hover:delay-300">
                                            <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mr-1.5">Idle:</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white">{stats.idle}</span>
                                    </div>

                                    {/* Queue Users */}
                                    <div className="flex items-center gap-2" title="Users in Queue">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.6)]" />
                                        <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-500 ease-in-out delay-0 group-hover:delay-300">
                                            <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap mr-1.5">Queue:</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-white">{stats.queuing}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Match Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">
                                        Match Type
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center p-3 bg-[#0f0f14] rounded-lg border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all">
                                            <input
                                                type="radio"
                                                name="matchType"
                                                value="regular"
                                                checked={matchType === 'regular'}
                                                onChange={(e) => setMatchType(e.target.value as MatchType)}
                                                className="mr-3"
                                            />
                                            <div className="flex-1">
                                                <span className="text-white font-medium">Regular Match</span>
                                                <p className="text-gray-500 text-xs">Uses free trial or 1 regular token</p>
                                            </div>
                                            <span className="text-2xl">🪙</span>
                                        </label>

                                        <label
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onAlert("Will be introduced later");
                                            }}
                                            className="flex items-center p-3 bg-gradient-to-r from-yellow-900/10 to-orange-900/10 rounded-lg border border-yellow-500/20 cursor-not-allowed transition-all relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    🔒 Coming Soon
                                                </span>
                                            </div>
                                            <input
                                                type="radio"
                                                name="matchType"
                                                value="golden"
                                                checked={false} // Force unchecked
                                                disabled
                                                className="mr-3"
                                            />
                                            <div className="flex-1 filter blur-[1px]">
                                                <span className="text-white font-medium">Golden Match</span>
                                                <p className="text-gray-400 text-xs">Uses 1 Golden token - Higher chance to match with opposite gender</p>
                                            </div>
                                            <span className="text-2xl filter blur-[1px]">⭐</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Preferred Branch */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">
                                        Preferred Branch
                                    </label>
                                    <select
                                        className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                                        value={preferredBranch}
                                        onChange={(e) => setPreferredBranch(e.target.value)}
                                    >
                                        <option value="" className="bg-[#16161d]">Any Branch</option>
                                        {BRANCHES.map(b => <option key={b} value={b} className="bg-[#16161d]">{b}</option>)}
                                    </select>
                                </div>

                                {/* Preferred Gender */}
                                {matchType === 'regular' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-400">
                                            Preferred Gender
                                        </label>
                                        <select
                                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                                            value={preferredGender}
                                            onChange={(e) => setPreferredGender(e.target.value)}
                                        >
                                            <option value="" className="bg-[#16161d]">Any Gender</option>
                                            {GENDERS.map(g => <option key={g} value={g} className="bg-[#16161d]">{g}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Mood Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">
                                        Current Mood
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600"
                                        placeholder="e.g., Happy, Bored, Excited"
                                        value={mood}
                                        onChange={(e) => setMood(e.target.value)}
                                    />
                                </div>

                                {/* Preferred Language */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">
                                        Preferred Language
                                    </label>
                                    <select
                                        className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                                        value={preferredLanguage}
                                        onChange={(e) => setPreferredLanguage(e.target.value)}
                                    >
                                        <option value="" className="bg-[#16161d]">Any Language</option>
                                        {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#16161d]">{l}</option>)}
                                    </select>
                                </div>



                                {/* Join Room Button */}
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={!hasTokens() || !isConnected}
                                    className={`w-full font-medium py-3.5 rounded-lg transition-all mt-2 ${hasTokens() && isConnected
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]'
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {!isConnected
                                        ? 'Starting server(Connecting...)'
                                        : (hasTokens() ? 'Join a Room' : 'No Tokens Available - Buy Tokens')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="relative max-w-7xl mx-auto mt-20 pb-12 px-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="text-gray-500 font-medium tracking-[0.2em] text-xs uppercase hover:text-purple-400 transition-colors cursor-default">
                        A Project by Kraken
                    </p>
                    <div className="flex items-center justify-center gap-6 w-full max-w-lg mx-auto">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                        <span className="text-gray-600 text-[10px] tracking-wider font-mono hover:text-purple-400 transition-colors cursor-default">
                            &copy; 2025 krak.ohmegle
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                    </div>
                </div>
            </footer>

            {/* Token Shop Modal */}
            {showTokenShop && (
                <TokenShop
                    onClose={() => setShowTokenShop(false)}
                    onPurchase={handlePurchase}
                />
            )}

            {/* Payment Notifications Modal */}
            {showNotifications && (
                <PaymentNotifications
                    onClose={() => setShowNotifications(false)}
                />
            )}

            {/* Payment Help Modal */}
            {showHelp && (
                <PaymentHelpModal
                    onClose={() => setShowHelp(false)}
                />
            )}

            {/* Payment Caution Modal */}
            {showCaution && (
                <PaymentCautionModal
                    onClose={() => setShowCaution(false)}
                />
            )}

            {/* Public Profile View Modal */}
            {selectedUserProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <DashboardModal
                        onClose={() => setSelectedUserProfile(null)}
                        profile={selectedUserProfile}
                    />
                </div>
            )}

            {/* Donation Modal */}
            {showDonation && (
                <DonationModal
                    onClose={() => setShowDonation(false)}
                />
            )}

            {/* Dashboard Modal */}
            {showDashboard && (
                <DashboardModal
                    profile={profile}
                    onClose={() => setShowDashboard(false)}
                />
            )}
        </div>
    );
};
