import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import './AdminDashboard.css';

interface Payment {
    paymentId: string;
    userId: string;
    userName: string;
    userEmail: string;
    packageName: string;
    amount: number;
    utr: string;
    status: string;
    createdAt: Date;
    submittedAt: Date;
    tokenType: string;
    tokenAmount: number;
}

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
}

const API_URL = 'http://localhost:3000/api/payments';

function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchPendingPayments = async () => {
        try {
            const token = await auth.currentUser?.getIdToken();

            const response = await fetch(`${API_URL}/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payments');
            }

            const data = await response.json();
            setPayments(data.payments || []);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPayments();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchPendingPayments, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (paymentId: string) => {
        if (!confirm('Are you sure you want to approve this payment?')) return;

        setProcessing(paymentId);
        try {
            const token = await auth.currentUser?.getIdToken();

            const response = await fetch(`${API_URL}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentId,
                    adminNotes: 'Approved via admin panel'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to approve payment');
            }

            // Refresh payments list
            await fetchPendingPayments();
            alert('✅ Payment approved successfully!');
        } catch (err: any) {
            alert('❌ Error: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (paymentId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setProcessing(paymentId);
        try {
            const token = await auth.currentUser?.getIdToken();

            const response = await fetch(`${API_URL}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentId,
                    reason
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reject payment');
            }

            // Refresh payments list
            await fetchPendingPayments();
            alert('✅ Payment rejected');
        } catch (err: any) {
            alert('❌ Error: ' + err.message);
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>💼 Admin Panel</h1>
                        <p className="header-subtitle">Payment Management</p>
                    </div>
                    <div className="header-actions">
                        <span className="admin-email">{user.email}</span>
                        <button onClick={onLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-container">
                    {/* Stats */}
                    <div className="stats-card">
                        <div className="stat">
                            <span className="stat-label">Pending Payments</span>
                            <span className="stat-value">{payments.length}</span>
                        </div>
                        <button
                            onClick={fetchPendingPayments}
                            className="refresh-btn"
                            disabled={loading}
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-banner">
                            ❌ {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading payments...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && payments.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">✅</div>
                            <h3>No Pending Payments</h3>
                            <p>All payments have been processed</p>
                        </div>
                    )}

                    {/* Payments List */}
                    {!loading && payments.length > 0 && (
                        <div className="payments-list">
                            {payments.map((payment) => (
                                <div key={payment.paymentId} className="payment-card">
                                    <div className="payment-header">
                                        <div>
                                            <h3>{payment.userName}</h3>
                                            <p className="payment-email">{payment.userEmail}</p>
                                        </div>
                                        <span className="time-ago">{getTimeAgo(payment.submittedAt)}</span>
                                    </div>

                                    <div className="payment-details">
                                        <div className="detail-row">
                                            <span className="label">Package:</span>
                                            <span className="value">{payment.packageName}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Amount:</span>
                                            <span className="value amount">₹{payment.amount}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">UTR:</span>
                                            <span className="value utr">{payment.utr}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Tokens:</span>
                                            <span className="value">{payment.tokenAmount} {payment.tokenType}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Submitted:</span>
                                            <span className="value">{formatDate(payment.submittedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="payment-actions">
                                        <button
                                            onClick={() => handleApprove(payment.paymentId)}
                                            disabled={processing === payment.paymentId}
                                            className="approve-btn"
                                        >
                                            {processing === payment.paymentId ? '⏳ Processing...' : '✅ Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(payment.paymentId)}
                                            disabled={processing === payment.paymentId}
                                            className="reject-btn"
                                        >
                                            ❌ Reject
                                        </button>
                                    </div>

                                    <div className="payment-note">
                                        💡 Verify UTR in your UPI app before approving
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
