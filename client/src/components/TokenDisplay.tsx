import React, { useState } from 'react';
import type { UserTokens } from '../types';

interface TokenDisplayProps {
    tokens: UserTokens;
    onBuyTokens: () => void;
    onShowNotifications: () => void;
    onRefresh: () => void;
    onAlert: (message: string) => void;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({ tokens, onShowNotifications, onRefresh, onAlert }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    return (
        <div className="bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Token Balance</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        className={`px-3 py-2 bg-[#0f0f14] hover:bg-[#1a1a24] text-white text-sm font-medium rounded-lg transition-all border border-white/5 hover:border-green-500/50 ${isRefreshing ? 'animate-spin-once' : ''}`}
                        title="Refresh Balance"
                        style={{
                            animation: isRefreshing ? 'spin 0.6s linear' : 'none'
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ display: 'block' }}
                        >
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                    </button>
                    <button
                        onClick={onShowNotifications}
                        className="px-3 py-2 bg-[#0f0f14] hover:bg-[#1a1a24] text-white text-sm font-medium rounded-lg transition-all border border-white/5 hover:border-purple-500/50"
                        title="Payment History"
                    >
                        🔔
                    </button>
                    <button
                        onClick={() => onAlert("Payment option is on hold for now... currently tokens are free!")}
                        className="px-4 py-2 bg-purple-600/50 text-white/50 text-sm font-medium rounded-lg transition-all shadow-lg shadow-purple-600/10 cursor-not-allowed flex items-center gap-2"
                        style={{ filter: 'blur(1px)' }}
                    >
                        🔒 💳 Buy Tokens
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {/* Free Trials */}
                <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎁</span>
                        <div>
                            <p className="text-white font-medium text-sm">Free Trials</p>
                            <p className="text-gray-500 text-xs">No cost chats</p>
                        </div>
                    </div>
                    <span className="text-white font-bold text-lg">{tokens.freeTrialsRemaining}</span>
                </div>

                {/* Regular Tokens */}
                <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🪙</span>
                        <div>
                            <p className="text-white font-medium text-sm">Regular Tokens</p>
                            <p className="text-gray-500 text-xs">Any gender matching</p>
                        </div>
                    </div>
                    <span className="text-white font-bold text-2xl">∞</span>
                </div>

                {/* Golden Tokens */}
                <div className="flex items-center justify-between p-3 bg-[#0f0f14] rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⭐</span>
                        <div>
                            <p className="text-white font-medium text-sm">Golden Tokens</p>
                            <p className="text-gray-500 text-xs">Higher chance for opposite gender match</p>
                        </div>
                    </div>
                    <span className="text-white font-bold text-lg">{tokens.goldenTokens}</span>
                </div>
            </div>
        </div>
    );
};
