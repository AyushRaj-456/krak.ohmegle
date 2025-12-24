import React, { useState } from 'react';
import type { User } from '../types';

interface CreateProfileProps {
    onJoin: (user: User) => void;
}

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER'];
const GENDERS = ['Male', 'Female', 'Other'];

export const CreateProfile: React.FC<CreateProfileProps> = ({ onJoin }) => {
    const [name, setName] = useState('');
    const [branch, setBranch] = useState(BRANCHES[0]);
    const [gender, setGender] = useState(GENDERS[0]);
    const [mode, setMode] = useState<'text' | 'video'>('text');

    // Filters
    const [filterBranch, setFilterBranch] = useState<string>('');
    const [filterGender, setFilterGender] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onJoin({
            name,
            branch,
            gender,
            mode,
            filters: {
                branch: filterBranch || undefined,
                gender: filterGender || undefined
            }
        });
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-[#0a0a0f] p-6 overflow-hidden">
            {/* Subtle blurred background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Main card with glassmorphism */}
            <div className="relative w-full max-w-md bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight flex items-center justify-center gap-1">
                        <span>SI</span>
                        <svg
                            className="w-8 h-8 inline-block"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                            <line x1="6" y1="2" x2="6" y2="4" />
                            <line x1="10" y1="2" x2="10" y2="4" />
                            <line x1="14" y1="2" x2="14" y2="4" />
                        </svg>
                        <span className="ml-1">Ωegle</span>
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Random chat with SIT students
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Name Input */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Name
                        </label>
                        <input
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Branch */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                Branch
                            </label>
                            <select
                                className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                            >
                                {BRANCHES.map(b => <option key={b} value={b} className="bg-[#16161d]">{b}</option>)}
                            </select>
                        </div>

                        {/* Gender */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                Gender
                            </label>
                            <select
                                className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                {GENDERS.map(g => <option key={g} value={g} className="bg-[#16161d]">{g}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Mode Selection with smooth transition */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Mode
                        </label>
                        <div className="relative grid grid-cols-2 gap-0 bg-[#0f0f14] rounded-lg p-1 border border-white/5">
                            {/* Sliding background indicator */}
                            <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-purple-600 rounded-md transition-all duration-300 ease-out shadow-lg shadow-purple-600/30 ${mode === 'text' ? 'left-1' : 'left-[calc(50%+2px)]'
                                    }`}
                            />

                            <button
                                type="button"
                                className={`relative z-10 py-3 rounded-md font-medium transition-all duration-300 ${mode === 'text'
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                                onClick={() => setMode('text')}
                            >
                                Text
                            </button>
                            <button
                                type="button"
                                className={`relative z-10 py-3 rounded-md font-medium transition-all duration-300 ${mode === 'video'
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                                onClick={() => setMode('video')}
                            >
                                Video
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wide">
                            Preferences (Optional)
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                className="w-full bg-[#0f0f14] text-gray-400 text-sm rounded-lg px-3 py-2 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                            >
                                <option value="" className="bg-[#16161d]">Any Branch</option>
                                {BRANCHES.map(b => <option key={b} value={b} className="bg-[#16161d]">{b}</option>)}
                            </select>
                            <select
                                className="w-full bg-[#0f0f14] text-gray-400 text-sm rounded-lg px-3 py-2 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-white/10"
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value)}
                            >
                                <option value="" className="bg-[#16161d]">Any Gender</option>
                                {GENDERS.map(g => <option key={g} value={g} className="bg-[#16161d]">{g}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3.5 rounded-lg transition-all mt-6 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start
                    </button>
                </form>
            </div>
        </div>
    );
};
