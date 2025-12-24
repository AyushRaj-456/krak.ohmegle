import { useState, useEffect, useRef } from 'react';
import { createPayment, submitUTR, type PaymentResponse } from '../services/paymentService';
import './PaymentModal.css';

interface PaymentModalProps {
    packageId: string;
    packageName: string;
    amount: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentModal({
    packageId,
    packageName,
    amount,
    onClose,
    onSuccess
}: PaymentModalProps) {
    const [step, setStep] = useState<'loading' | 'qr' | 'utr' | 'success' | 'error'>('loading');
    const [payment, setPayment] = useState<PaymentResponse | null>(null);
    const [utr, setUtr] = useState('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const initialized = useRef(false);

    // Create payment on mount
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initPayment = async () => {
            try {
                const paymentData = await createPayment(packageId);
                setPayment(paymentData);
                setStep('qr');
            } catch (err: any) {
                setError(err.message);
                setStep('error');
            }
        };

        initPayment();
    }, [packageId]);

    // Countdown timer
    useEffect(() => {
        if (step !== 'qr' || !payment) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expiresAt = new Date(payment.expiresAt).getTime();
            const remaining = Math.floor((expiresAt - now) / 1000);

            if (remaining <= 0) {
                setError('Payment request expired. Please try again.');
                setStep('error');
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [step, payment]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmitUTR = async () => {
        if (!payment) return;

        // Validate UTR
        if (!/^\d{12}$/.test(utr)) {
            setError('UTR must be exactly 12 digits');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await submitUTR(payment.paymentId, utr);
            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 3000);
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const handleCopyUPI = () => {
        if (payment) {
            navigator.clipboard.writeText(payment.upiId);
            alert('UPI ID copied to clipboard!');
        }
    };

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                {/* Loading State */}
                {step === 'loading' && (
                    <div className="payment-step">
                        <div className="spinner border-t-white"></div>
                        <p className="text-white mt-4 font-medium">Creating payment request...</p>
                    </div>
                )}

                {/* QR Code Display */}
                {step === 'qr' && payment && (
                    <div className="payment-step">
                        <h2 className="text-white text-2xl font-bold mb-4">💳 Complete Payment</h2>
                        {payment.isResumed && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <p className="text-red-200 text-sm font-medium">
                                    There is a pending request. To avoid any token loss kindly wait for that request to complete.
                                </p>
                            </div>
                        )}
                        <div className="package-info">
                            <p className="package-name">{packageName}</p>
                            <p className="package-amount">₹{amount}</p>
                        </div>

                        <div className="timer">
                            <span className="timer-icon">⏱️</span>
                            <span className="timer-text">Time remaining: {formatTime(timeLeft)}</span>
                        </div>

                        <div className="warning-box">
                            <strong>⚠️ IMPORTANT:</strong> After making the payment, you MUST click the button below and submit your UTR number. Otherwise, your payment will NOT be processed and your money may be lost!
                        </div>

                        <div className="qr-section">
                            <p className="instruction">Scan QR code with any UPI app</p>
                            <div className="qr-container">
                                <img
                                    src={payment.qrCodeUrl}
                                    alt="UPI QR Code"
                                    className="qr-code"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>

                            <div className="upi-id-section">
                                <p className="or-text">OR</p>
                                <p className="instruction">Pay to UPI ID:</p>
                                <div className="upi-id-box">
                                    <span className="upi-id">{payment.upiId}</span>
                                    <button onClick={handleCopyUPI} className="copy-btn">
                                        📋 Copy
                                    </button>
                                </div>
                            </div>
                        </div>



                        <button
                            onClick={() => setStep('utr')}
                            className="next-btn"
                        >
                            I've Paid ₹{amount} →
                        </button>

                        <div className="help-text">
                            💡 After payment, you'll need to enter the 12-digit UTR number
                        </div>
                    </div>
                )}

                {/* UTR Submission */}
                {step === 'utr' && payment && (
                    <div className="payment-step">
                        <h2>📝 Enter UTR Number</h2>

                        <div className="utr-info">
                            <p>Find the 12-digit UTR/Transaction ID in your UPI app</p>
                            <div className="utr-help">
                                <details>
                                    <summary>How to find UTR?</summary>
                                    <ul>
                                        <li><strong>Google Pay:</strong> Transaction details → UPI transaction ID</li>
                                        <li><strong>PhonePe:</strong> History → Transaction → Transaction ID</li>
                                        <li><strong>Paytm:</strong> Passbook → Transaction → UTR</li>
                                    </ul>
                                </details>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="utr-input-group">
                            <label>UTR Number (12 digits)</label>
                            <input
                                type="text"
                                value={utr}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    setUtr(value);
                                    setError('');
                                }}
                                placeholder="123456789012"
                                maxLength={12}
                                className="utr-input"
                                autoFocus
                            />
                            <span className="char-count">{utr.length}/12</span>
                        </div>

                        <div className="button-group">
                            <button
                                onClick={() => setStep('qr')}
                                className="back-btn"
                                disabled={submitting}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmitUTR}
                                className="submit-btn"
                                disabled={utr.length !== 12 || submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit UTR'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {step === 'success' && (
                    <div className="payment-step success">
                        <div className="success-icon">✅</div>
                        <h2>Payment Submitted!</h2>
                        <p>Your payment is being verified by our admin.</p>
                        <p className="success-note">You'll receive tokens once approved (usually within a few minutes)</p>
                    </div>
                )}

                {/* Error State */}
                {step === 'error' && (
                    <div className="payment-step error">
                        <div className="error-icon">❌</div>
                        <h2 className="text-white text-2xl font-bold mt-2 mb-2">Payment Failed</h2>
                        <p className="error-text">{error}</p>

                        {error.includes('pending payment') ? (
                            <div className="mt-4">
                                <p className="text-yellow-400 text-sm mb-4 bg-yellow-400/10 p-3 rounded border border-yellow-400/20 text-left">
                                    ⚠️ <strong>Warning:</strong> Make sure the UTR you enter matches this NEW payment request. Do not mix it up with the previous one!
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep('loading');
                                            setError('');
                                            // Force create new payment
                                            createPayment(packageId, true)
                                                .then(paymentData => {
                                                    setPayment(paymentData);
                                                    setStep('qr');
                                                })
                                                .catch(err => {
                                                    setError(err.message);
                                                    setStep('error');
                                                });
                                        }}
                                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-medium transition-colors"
                                    >
                                        Create Anyway
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={onClose} className="close-error-btn">
                                Close
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
