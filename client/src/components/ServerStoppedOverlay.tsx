import React from 'react';
import { AuthPage } from './AuthPage';

interface ServerStoppedOverlayProps {
    onExit: () => void;
}

export const ServerStoppedOverlay: React.FC<ServerStoppedOverlayProps> = ({ onExit }) => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Blurred Background with AuthPage - giving it a look of "inactive app" */}
            <div className="absolute inset-0 z-0 blur-sm pointer-events-none opacity-50">
                <AuthPage onAuth={() => { }} />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-1000">
                <div className="text-center space-y-8 max-w-4xl relative p-12 rounded-3xl border border-purple-500/30 bg-black/40 backdrop-blur-3xl shadow-2xl shadow-purple-500/10">
                    {/* Background Glow inside the card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/10 rounded-3xl blur-3xl -z-10"></div>

                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-500 tracking-wider font-mono drop-shadow-2xl">
                            Video Server Stopped
                        </h1>
                        <span className="text-sm md:text-base text-gray-600 font-medium">
                            (by developer)
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl md:text-3xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto">
                            The developer can’t afford a $50/month backend server for video calls 🥺💔
                        </h2>
                        <p className="text-gray-400">
                            But you can still use <b>Text Chat</b>!
                        </p>
                    </div>

                    <div className="pt-8 flex flex-col items-center gap-8">
                        <button
                            onClick={onExit}
                            className="group relative px-8 py-4 bg-[#0f0f14] hover:bg-[#1a1a24] text-white font-bold rounded-2xl border border-white/10 hover:border-purple-500/50 shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative flex items-center gap-3 text-lg">
                                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                </svg>
                                Go Back to Text Chat
                            </span>
                        </button>

                        <p className="text-orange-500 font-mono text-sm tracking-wide font-medium opacity-90">
                            Have a great day ahead - KRAK(Σ)N
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
