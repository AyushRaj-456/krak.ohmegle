
import { useRef, useEffect } from 'react';
import './PaymentModal.css';

import type { ProfileData } from '../types';

interface DashboardModalProps {
    onClose: () => void;
    profile: ProfileData;
}

export default function DashboardModal({ onClose, profile }: DashboardModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const formatDuration = (seconds: number = 0) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const getTopStat = (record?: Record<string, number>) => {
        if (!record) return "N/A";
        const entries = Object.entries(record);
        if (entries.length === 0) return "N/A";
        return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    };

    // Calculate Gender Distribution
    const genderMatches = profile.stats?.genderMatches || {};
    const maleMatches = genderMatches['Male'] || 0;
    const femaleMatches = genderMatches['Female'] || 0;
    const totalGenderMatches = maleMatches + femaleMatches;

    let maleMale = 0;
    let maleFemale = 0;

    if (totalGenderMatches > 0) {
        // If user is Male: Male partners -> MM (Male-Male), Female partners -> MF (Male-Female)
        // If user is Female: Male partners -> FM (Male-Female), Female partners -> FF (Female-Female)
        // For simplicity based on user request "male-male, male-female":
        if (profile.gender === 'Male') {
            maleMale = Math.round((maleMatches / totalGenderMatches) * 100);
            maleFemale = Math.round((femaleMatches / totalGenderMatches) * 100);
        } else {
            // For female users, we can treat Male matches as "Male-Female" and Female matches as "Female-Female"
            // Start with mapping Male matches to the "Male-Female" slot visually?
            // Or just generic "Male" / "Female" percentages.
            // Let's stick to the labels but adjust values.
            maleMale = Math.round((femaleMatches / totalGenderMatches) * 100); // reuse var for female-female
            maleFemale = Math.round((maleMatches / totalGenderMatches) * 100);
        }
    }

    const stats = {
        totalCalls: profile.totalCalls || 0,
        monthlyCalls: 0, // Not implemented yet
        totalDuration: formatDuration(profile.totalTalkTime),
        longestCall: formatDuration(profile.longestCall),
        mostMatchedBranch: getTopStat(profile.stats?.branchMatches),
        mostMatchedMood: getTopStat(profile.stats?.moodMatches),
        mostMatchedHobbies: getTopStat(profile.stats?.hobbyMatches),
        genderDistribution: {
            maleMale: totalGenderMatches > 0 ? maleMale : 0,
            maleFemale: totalGenderMatches > 0 ? maleFemale : 0,
            // Labels for UI
            label1: profile.gender === 'Female' ? 'Female-Female' : 'Male-Male',
            label2: 'Male-Female'
        }
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal relative" ref={modalRef} style={{ maxWidth: '600px' }}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2 className="text-white text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {profile.name}'s Dashboard
                </h2>

                <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">Name</p>
                            <p className="text-white font-medium">{profile.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Branch</p>
                            <p className="text-white font-medium">{profile.branch}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Year</p>
                            <p className="text-white font-medium">{profile.year}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Gender</p>
                            <p className="text-white font-medium">{profile.gender}</p>
                        </div>
                    </div>
                    {profile.bio && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-gray-400 text-sm mb-1">Bio</p>
                            <p className="text-gray-300 text-sm italic">"{profile.bio}"</p>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-purple-400">📊</span> User Statistics
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {/* Total Calls */}
                    <div className="bg-[#0f0f14] p-3 rounded-xl border border-white/5 flex flex-col items-center group hover:border-purple-500/30 transition-all">
                        <div className="p-2 bg-purple-500/10 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-xs">Total Calls</p>
                        <p className="text-xl font-bold text-white">{stats.totalCalls}</p>
                    </div>

                    {/* Monthly Calls */}
                    <div className="bg-[#0f0f14] p-3 rounded-xl border border-white/5 flex flex-col items-center group hover:border-blue-500/30 transition-all">
                        <div className="p-2 bg-blue-500/10 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-xs">This Month</p>
                        <p className="text-xl font-bold text-white">{stats.monthlyCalls}</p>
                    </div>

                    {/* Total Duration */}
                    <div className="bg-[#0f0f14] p-3 rounded-xl border border-white/5 flex flex-col items-center group hover:border-green-500/30 transition-all">
                        <div className="p-2 bg-green-500/10 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-xs">Talk Time</p>
                        <p className="text-xl font-bold text-[#8b5cf6] text-center text-xs break-all">{stats.totalDuration}</p>
                    </div>

                    {/* Longest Call */}
                    <div className="bg-[#0f0f14] p-3 rounded-xl border border-white/5 flex flex-col items-center group hover:border-yellow-500/30 transition-all">
                        <div className="p-2 bg-yellow-500/10 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-xs">Longest Call</p>
                        <p className="text-xl font-bold text-[#fbbf24] text-center text-xs break-all">{stats.longestCall}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    {/* Insights */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 h-full">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Fun Insights
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Most Matched Branch</p>
                                <p className="text-white font-medium text-sm">{stats.mostMatchedBranch}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Most Matched Mood</p>
                                <p className="text-white font-medium text-sm">{stats.mostMatchedMood}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Most Matched Hobbies</p>
                                <p className="text-white font-medium text-sm">{stats.mostMatchedHobbies}</p>
                            </div>
                        </div>
                    </div>

                    {/* Gender Distribution Pie Chart */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center h-full">
                        <h3 className="text-sm font-bold text-white mb-2">Call Distribution</h3>
                        <div className="relative w-24 h-24 rounded-full" style={{
                            background: `conic-gradient(#3b82f6 0% ${stats.genderDistribution.maleMale}%, #ec4899 ${stats.genderDistribution.maleMale}% 100%)`
                        }}>
                            <div className="absolute inset-3 bg-[#16161d] rounded-full flex items-center justify-center">
                                <span className="text-[10px] text-gray-400 text-center leading-tight">Gender<br />Ratio</span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-3 text-[10px]">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                                <span className="text-gray-300">{stats.genderDistribution.label1} ({stats.genderDistribution.maleMale}%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-pink-500 rounded-sm"></div>
                                <span className="text-gray-300">{stats.genderDistribution.label2} ({stats.genderDistribution.maleFemale}%)</span>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
