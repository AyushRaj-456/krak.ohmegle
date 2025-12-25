import React, { useState } from 'react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, file: File | null) => void;
    userName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, userName }) => {
    const [reason, setReason] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onSubmit(reason, file);
            setIsSubmitting(false);
            setReason('');
            setFile(null);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#16161d] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Report User</h2>
                    <p className="text-gray-400 text-sm">Reporting <span className="text-white font-medium">{userName}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Reason for reporting <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full bg-[#0a0a0f] text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder-gray-600 resize-none h-32"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please describe the issue..."
                            required
                        />
                    </div>

                    {/* Screenshot Upload (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Proof Screenshot (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                                id="proof-upload"
                            />
                            <label
                                htmlFor="proof-upload"
                                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all text-gray-400 text-sm gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {file ? file.name : "Click to upload image"}
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-[#232329] hover:bg-[#2c2c35] text-gray-300 rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!reason.trim() || isSubmitting}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                'Submit Report'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
