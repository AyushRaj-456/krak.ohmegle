import { auth } from '../firebase';

const API_URL = (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000') + '/api/payments';

export interface PaymentResponse {
    success: boolean;
    paymentId: string;
    amount: number;
    expiresAt: Date;
    qrCodeUrl: string;
    upiId: string;
    isResumed?: boolean;
}

export interface Payment {
    paymentId: string;
    packageName: string;
    amount: number;
    status: string;
    utr?: string;
    createdAt: Date;
    submittedAt?: Date;
    processedAt?: Date;
    adminNotes?: string;
}

/**
 * Create a new payment request
 */
export async function createPayment(packageId: string, force: boolean = false): Promise<PaymentResponse> {
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ packageId, force })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
    }

    const data = await response.json();
    return {
        ...data,
        expiresAt: new Date(data.expiresAt)
    };
}

/**
 * Submit UTR for a payment
 */
export async function submitUTR(paymentId: string, utr: string): Promise<void> {
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_URL}/submit-utr`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId, utr })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit UTR');
    }
}

/**
 * Get user's payment history
 */
export async function getMyPayments(): Promise<Payment[]> {
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_URL}/my-payments`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch payment history');
    }

    const data = await response.json();
    return data.payments.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        submittedAt: p.submittedAt ? new Date(p.submittedAt) : undefined,
        processedAt: p.processedAt ? new Date(p.processedAt) : undefined
    }));
}

/**
 * Delete a payment (only for rejected/expired payments)
 */
export async function deletePayment(paymentId: string): Promise<void> {
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(`${API_URL}/delete/${paymentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete payment');
    }
}
