import React from 'react';

interface NavbarProps {
    isOpen: boolean;
    onClose: () => void;
    currentSection: 'profile' | 'store' | 'match';
    onSectionChange: (section: 'profile' | 'store' | 'match') => void;
    onSignOff: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isOpen, onClose, currentSection, onSectionChange, onSignOff }) => {
    const handleSectionClick = (section: 'profile' | 'store' | 'match') => {
        onSectionChange(section);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sliding Menu */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-[#16161d] border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-1">
                            <span>SI</span>
                            <svg
                                className="w-6 h-6 inline-block"
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
                            <span>Ωegle</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm">Navigate through sections</p>
                </div>

                {/* Navigation Items */}
                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => handleSectionClick('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentSection === 'profile'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Profile</span>
                    </button>

                    <button
                        onClick={() => handleSectionClick('store')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentSection === 'store'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Token Store</span>
                    </button>

                    <button
                        onClick={() => handleSectionClick('match')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentSection === 'match'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">Start Matching</span>
                    </button>
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <button
                        onClick={onSignOff}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-600/20 hover:border-red-600/40"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Sign Off</span>
                    </button>
                </div>
            </div>
        </>
    );
};
