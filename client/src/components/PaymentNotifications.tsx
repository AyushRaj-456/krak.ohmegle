import { useState, useEffect } from 'react';
import { getMyPayments, deletePayment, type Payment } from '../services/paymentService';
import './PaymentNotifications.css';

interface PaymentNotificationsProps {
    onClose: () => void;
}

export default function PaymentNotifications({ onClose }: PaymentNotificationsProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const data = await getMyPayments();
            setPayments(data);
        } catch (err) {
            console.error('Failed to fetch payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPayments();
        setTimeout(() => setRefreshing(false), 600); // Keep spinning for animation
    };

    const handleDelete = async (paymentId: string, status: string) => {
        if (status === 'pending') {
            const confirmed = confirm(
                '⚠️ WARNING: If you have already made the payment and have a valid UTR, deleting this will prevent you from getting tokens!\n\nIf you have a valid UTR, please submit it instead.\n\nAre you sure you want to delete this pending payment?'
            );
            if (!confirmed) return;
        } else {
            if (!confirm('Are you sure you want to delete this payment record?')) {
                return;
            }
        }

        setDeleting(paymentId);
        try {
            await deletePayment(paymentId);
            setPayments(payments.filter(p => p.paymentId !== paymentId));
        } catch (err: any) {
            alert('Failed to delete: ' + err.message);
        } finally {
            setDeleting(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'pending': return 'status-pending';
            case 'expired': return 'status-expired';
            default: return '';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return '✅';
            case 'rejected': return '❌';
            case 'pending': return '⏳';
            case 'expired': return '⌛';
            default: return '📄';
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    return (
        <div className="notifications-overlay" onClick={onClose}>
            <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
                <div className="notifications-header">
                    <button onClick={onClose} className="notification-close-btn">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <h2>💳 Payment History</h2>
                    <button
                        onClick={handleRefresh}
                        className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
                        title="Refresh payments"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                    </button>
                </div>

                <div className="notifications-content">
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading...</p>
                        </div>
                    )}

                    {!loading && payments.length === 0 && (
                        <div className="empty-state">
                            <p>No payment history</p>
                        </div>
                    )}

                    {!loading && payments.length > 0 && (
                        <div className="payments-list">
                            {[
                                { title: '10 Regular Tokens (₹20)', filter: (p: Payment) => p.packageName.includes('10 Regular') },
                                { title: '30 Regular Tokens (₹50)', filter: (p: Payment) => p.packageName.includes('30 Regular') },
                                { title: 'Golden Tokens', filter: (p: Payment) => p.packageName.includes('Golden') }
                            ].map((section) => {
                                const sectionPayments = payments.filter(section.filter);
                                if (sectionPayments.length === 0) return null;

                                return (
                                    <div key={section.title} className="payment-section mb-6 last:mb-0">
                                        <h3 className="section-title text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">
                                            {section.title}
                                        </h3>
                                        {sectionPayments.map((payment) => (
                                            <div key={payment.paymentId} className={`payment-item ${getStatusColor(payment.status)} mb-3 last:mb-0`}>
                                                <div className="payment-header">
                                                    <span className="status-icon">{getStatusIcon(payment.status)}</span>
                                                    <div className="payment-info">
                                                        <h3>{payment.packageName}</h3>
                                                        <p className="payment-amount">₹{payment.amount}</p>
                                                    </div>
                                                    <div className="header-actions">
                                                        <span className={`status-badge ${getStatusColor(payment.status)}`}>
                                                            {payment.status.toUpperCase()}
                                                        </span>
                                                        {(payment.status === 'rejected' || payment.status === 'expired' || payment.status === 'approved' || payment.status === 'pending') && (
                                                            <button
                                                                onClick={() => handleDelete(payment.paymentId, payment.status)}
                                                                disabled={deleting === payment.paymentId}
                                                                className="delete-btn"
                                                                title="Delete this record"
                                                            >
                                                                {deleting === payment.paymentId ? '⏳' : '🗑️'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="payment-details">
                                                    {payment.utr && (
                                                        <div className="detail-row">
                                                            <span className="label">UTR:</span>
                                                            <span className="value">{payment.utr}</span>
                                                        </div>
                                                    )}
                                                    <div className="detail-row">
                                                        <span className="label">Created:</span>
                                                        <span className="value">{formatDate(payment.createdAt)}</span>
                                                    </div>
                                                    {payment.processedAt && (
                                                        <div className="detail-row">
                                                            <span className="label">Processed:</span>
                                                            <span className="value">{formatDate(payment.processedAt)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {payment.status === 'rejected' && (
                                                    <div className="rejection-reason">
                                                        <strong>Rejection Reason:</strong> {payment.adminNotes || 'No reason provided'}
                                                    </div>
                                                )}

                                                {payment.status === 'approved' && (
                                                    <div className="approval-message">
                                                        ✨ Tokens credited successfully!
                                                    </div>
                                                )}

                                                {payment.status === 'pending' && payment.utr && (
                                                    <div className="pending-message">
                                                        ⏳ Payment submitted. Waiting for admin approval...
                                                    </div>
                                                )}

                                                {payment.status === 'pending' && !payment.utr && (
                                                    <div className="incomplete-payment-section">
                                                        <div className="incomplete-message">
                                                            ⚠️ Payment incomplete. Please submit your UTR number.
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const utrInput = prompt('Enter your 12-digit UTR number:');
                                                                if (utrInput && /^\d{12}$/.test(utrInput)) {
                                                                    setDeleting(payment.paymentId);
                                                                    import('../services/paymentService').then(({ submitUTR }) => {
                                                                        submitUTR(payment.paymentId, utrInput)
                                                                            .then(() => {
                                                                                alert('UTR submitted successfully! Waiting for admin approval.');
                                                                                fetchPayments();
                                                                            })
                                                                            .catch(err => {
                                                                                alert('Failed to submit UTR: ' + err.message);
                                                                            })
                                                                            .finally(() => setDeleting(null));
                                                                    });
                                                                } else if (utrInput) {
                                                                    alert('UTR must be exactly 12 digits');
                                                                }
                                                            }}
                                                            disabled={deleting === payment.paymentId}
                                                            className="submit-utr-btn"
                                                        >
                                                            {deleting === payment.paymentId ? '⏳ Submitting...' : '📝 Submit UTR'}
                                                        </button>
                                                    </div>
                                                )}

                                                {payment.status === 'expired' && (
                                                    <div className="expired-message">
                                                        ⌛ Payment request expired. Please create a new one.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
