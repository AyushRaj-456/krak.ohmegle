import React, { useState } from 'react';
import type { TokenPackage } from '../types';
import PaymentModal from './PaymentModal';

interface TokenShopProps {
    onClose: () => void;
    onPurchase: (packageId: string) => void;
}

const TOKEN_PACKAGES: TokenPackage[] = [
    {
        id: 'regular_10',
        name: '10 Regular Tokens',
        tokens: 10,
        price: 20,
        type: 'regular',
        description: 'Match with any gender'
    },
    {
        id: 'regular_30',
        name: '30 Regular Tokens',
        tokens: 30,
        price: 50,
        type: 'regular',
        description: 'Best value! Match with any gender'
    },
    {
        id: 'golden_5',
        name: '5 Golden Tokens',
        tokens: 5,
        price: 20,
        type: 'golden',
        description: 'Match with opposite gender'
    }
];

export const TokenShop: React.FC<TokenShopProps> = ({ onClose, onPurchase }) => {
    const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);

    const handleBuyClick = (pkg: TokenPackage) => {
        setSelectedPackage(pkg);
    };

    const handlePaymentSuccess = () => {
        // Refresh token balance or notify parent
        onPurchase(selectedPackage!.id);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                <div className="relative bg-[#16161d]/95 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Token Shop</h2>
                        <p className="text-gray-400 text-sm">Choose a package to continue chatting</p>
                    </div>

                    {/* Regular Tokens Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4">Regular Tokens</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TOKEN_PACKAGES.filter(pkg => pkg.type === 'regular').map(pkg => (
                                <div
                                    key={pkg.id}
                                    className="bg-[#0f0f14] rounded-xl p-6 border border-white/5 hover:border-purple-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">🪙</span>
                                        <div>
                                            <h4 className="text-white font-bold">{pkg.name}</h4>
                                            <p className="text-gray-500 text-xs">{pkg.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-2xl font-bold text-purple-400">₹{pkg.price}</span>
                                        <button
                                            onClick={() => handleBuyClick(pkg)}
                                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-105"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                    {pkg.id === 'regular_30' && (
                                        <div className="mt-2 text-center">
                                            <span className="text-xs text-green-400 font-semibold">🎉 Best Value!</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Premium Golden Tokens Section */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Premium Golden Tokens</h3>
                        <p className="text-gray-400 text-sm mb-4">Match with opposite gender</p>
                        <div className="grid grid-cols-1 gap-4">
                            {TOKEN_PACKAGES.filter(pkg => pkg.type === 'golden').map(pkg => (
                                <div
                                    key={pkg.id}
                                    className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-3xl">⭐</span>
                                        <div>
                                            <h4 className="text-white font-bold">{pkg.name}</h4>
                                            <p className="text-gray-400 text-xs">{pkg.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-2xl font-bold text-yellow-400">₹{pkg.price}</span>
                                        <button
                                            onClick={() => handleBuyClick(pkg)}
                                            className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-yellow-600/30 hover:shadow-yellow-600/40 hover:scale-105"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-300 text-xs text-center">
                            💡 Tokens are used when a match is found. No refunds for skipped matches.
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {selectedPackage && (
                <PaymentModal
                    key={selectedPackage.id}
                    packageId={selectedPackage.id}
                    packageName={selectedPackage.name}
                    amount={selectedPackage.price}
                    onClose={() => setSelectedPackage(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
};
