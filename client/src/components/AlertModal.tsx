import React from 'react';

interface AlertModalProps {
    message: string;
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#16161d] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100 animate-scale-in">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-white text-lg font-medium mb-6">
                        {message}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/30 active:scale-95"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
