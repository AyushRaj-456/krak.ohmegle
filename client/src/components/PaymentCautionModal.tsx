import { useRef, useEffect } from 'react';
import './PaymentModal.css';

interface PaymentCautionModalProps {
    onClose: () => void;
}

export default function PaymentCautionModal({ onClose }: PaymentCautionModalProps) {
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

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal" ref={modalRef}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2 className="text-white text-2xl font-bold mb-6 text-center">⚠️ What you should take care of</h2>

                <div className="space-y-6 text-gray-300">
                    <div className="step bg-white/5 p-4 rounded-lg border border-red-500/20">
                        <h3 className="text-red-400 font-bold text-lg mb-2">1. Multiple Payments</h3>
                        <p className="text-sm">
                            You can initiate multiple payment requests if you need different packages (e.g., 10 Regular, 30 Regular, and Golden).
                        </p>
                        <ul className="text-xs text-gray-400 list-disc pl-4 mt-2 space-y-1">
                            <li><strong>Limit:</strong> Max 2 requests per plan.</li>
                            <li><strong>Total Limit:</strong> Max 3 requests in total.</li>
                        </ul>
                    </div>

                    <div className="step bg-white/5 p-4 rounded-lg border border-yellow-500/20">
                        <h3 className="text-[#fbbf24] font-bold text-lg mb-2">2. Match UTR Correctly!</h3>
                        <p className="text-sm">
                            <strong className="text-white">Most Important:</strong> If you have multiple pending requests, do NOT mix them up!
                        </p>
                        <p className="text-sm mt-2">
                            Ensure the <strong>UTR/Transaction ID</strong> you enter belongs to the exact QR Code/Amount you just paid for. Mixed up UTRs will result in <strong>failed verification</strong>.
                        </p>
                    </div>

                    <div className="step bg-white/5 p-4 rounded-lg border border-white/10">
                        <h3 className="text-white font-bold text-lg mb-2">3. "Limits Applied" Error</h3>
                        <p className="text-sm">
                            If you see the message <strong>"TO AVOID SPAMMING, LIMITS APPLIED"</strong>, it means you have too many incomplete requests.
                        </p>
                        <p className="text-sm mt-2 text-gray-400">
                            You must complete your previous pending payments or delete them from history before making new ones.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-3 rounded-lg font-semibold transition-colors mt-4"
                    >
                        Understood 🫡
                    </button>
                </div>
            </div>
        </div>
    );
}
