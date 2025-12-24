import { useRef, useEffect } from 'react';
import './PaymentModal.css'; // Reusing styles for consistency

interface PaymentHelpModalProps {
    onClose: () => void;
}

export default function PaymentHelpModal({ onClose }: PaymentHelpModalProps) {
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

                <h2 className="text-white text-2xl font-bold mb-6 text-center">How Payment Works</h2>

                <div className="space-y-6 text-gray-300">
                    <div className="step bg-white/5 p-4 rounded-lg border border-white/10">
                        <h3 className="text-[#8b5cf6] font-bold text-lg mb-2">Step 1: Choose & Pay</h3>
                        <p className="text-sm">
                            Select a token package and click "Buy Now". Scan the QR code or copy the UPI ID to make the payment using any UPI app (Google Pay, PhonePe, Paytm, etc.).
                        </p>
                    </div>

                    <div className="step bg-white/5 p-4 rounded-lg border border-white/10">
                        <h3 className="text-[#fbbf24] font-bold text-lg mb-2">Step 2: Find UTR / Ref No.</h3>
                        <p className="text-sm mb-2">
                            <strong className="text-white">Crucial Step:</strong> After paying, looking for the <strong>12-digit UTR Number</strong> or <strong>UPI Reference ID</strong> in your payment app.
                        </p>
                        <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                            <li><strong>Google Pay:</strong> "UPI transaction ID"</li>
                            <li><strong>PhonePe:</strong> "Transaction ID" (UTR)</li>
                            <li><strong>Paytm:</strong> "UPI Ref No"</li>
                        </ul>
                    </div>

                    <div className="step bg-white/5 p-4 rounded-lg border border-white/10">
                        <h3 className="text-[#34d399] font-bold text-lg mb-2">Step 3: Submit & Get Tokens</h3>
                        <p className="text-sm">
                            Come back to the website, click <strong>"I've Paid"</strong>, and enter that 12-digit UTR number.
                        </p>
                        <p className="text-sm mt-2 text-[#fbbf24] font-medium border-t border-white/10 pt-2">
                            ⚠️ Without submitting the UTR, we cannot verify your payment and you won't get tokens!
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-3 rounded-lg font-semibold transition-colors mt-4"
                    >
                        Got it, I'm ready!
                    </button>
                </div>
            </div>
        </div>
    );
}
