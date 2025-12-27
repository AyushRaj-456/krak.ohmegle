
import { useRef, useEffect } from 'react';
import './PaymentModal.css';

interface DonationModalProps {
    onClose: () => void;
}

const UPI_ID = "--"; // <--- CHANGE THIS TO YOUR UPI ID

export default function DonationModal({ onClose }: DonationModalProps) {
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
            <div className="payment-modal relative" ref={modalRef}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <h2 className="text-white text-2xl font-bold mb-6 text-center">Support with a cup of tea</h2>

                <div className="space-y-6 text-gray-300 text-center">
                    <p className="text-gray-400">
                        If you enjoy using this app, consider supporting the development!
                    </p>

                    <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="bg-white p-4 rounded-lg mb-4">
                            {/* QR Code Image */}
                            <div className="w-48 h-48 bg-white flex items-center justify-center rounded overflow-hidden">
                                <img
                                    src="/qr-code.jpg"
                                    alt="Payment QR Code"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">Scan with any UPI App</p>

                        <div className="w-full bg-black/20 p-3 rounded-lg border border-white/5 flex items-center justify-between gap-3">
                            <code className="text-[#c4b5fd] font-mono text-sm">{UPI_ID}</code>
                            <button
                                onClick={() => navigator.clipboard.writeText(UPI_ID)}
                                className="text-xs bg-[#8b5cf6]/20 hover:bg-[#8b5cf6]/30 text-[#c4b5fd] px-2 py-1.5 rounded transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white py-3 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/20"
                    >
                        Thank You!
                    </button>
                </div>
            </div>
        </div>
    );
}
