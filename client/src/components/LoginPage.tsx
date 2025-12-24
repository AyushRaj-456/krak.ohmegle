import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username);
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

            {/* Login card */}
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
                        Login to start chatting
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Username Input */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Username
                        </label>
                        <input
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3.5 rounded-lg transition-all mt-6 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center text-xs text-gray-600 mt-6">
                    For SIT students only
                </p>
            </div>
        </div>
    );
};
