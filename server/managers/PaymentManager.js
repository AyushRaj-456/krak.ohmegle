import admin from 'firebase-admin';

/**
 * Payment Manager
 * Handles all payment-related operations
 */
export class PaymentManager {
    constructor() {
        // Use the already initialized Firebase Admin instance
        this.db = admin.firestore();
        this.TOKEN_PACKAGES = {
            'regular_10': { type: 'regular', amount: 10, price: 20, name: '10 Regular Tokens' },
            'regular_30': { type: 'regular', amount: 30, price: 50, name: '30 Regular Tokens' },
            'golden_5': { type: 'golden', amount: 5, price: 20, name: '5 Golden Tokens' }
        };
    }

    /**
     * Create a new payment request
     */
    async createPayment(userId, packageId, userInfo, metadata = {}) {
        try {
            const packageInfo = this.TOKEN_PACKAGES[packageId];

            if (!packageInfo) {
                throw new Error('Invalid package ID');
            }

            // Check for existing pending payment (not rejected or approved)
            const existingPending = await this.db.collection('payments')
                .where('userId', '==', userId)
                .where('status', '==', 'pending')
                .get();

            if (!existingPending.empty) {
                const now = admin.firestore.Timestamp.now();
                const activePending = existingPending.docs.filter(doc => {
                    const data = doc.data();
                    return data.expiresAt.seconds > now.seconds;
                });

                // Calculate counts
                const pendingCount = activePending.length;
                const planPendingCount = activePending.filter(doc => doc.data().packageId === packageId).length;

                // Check for exact match to resume (only if not forcing new)
                const exactMatch = activePending.find(doc => doc.data().packageId === packageId);

                if (exactMatch && (!metadata || !metadata.force)) {
                    const data = exactMatch.data();
                    return {
                        success: true,
                        paymentId: data.paymentId,
                        amount: data.amount,
                        expiresAt: data.expiresAt.toDate(),
                        isResumed: true
                    };
                }

                // If not resuming, check strict blocking rules
                if (!metadata || !metadata.force) {
                    // We have pending payments but didn't resume (so either different package, or user explicitly wants new one but didn't pass force - wait, strictly speaking if same package exists we resumed above. So this handles different package case).
                    const firstPending = activePending[0].data();
                    throw new Error(`You have a pending payment for ${firstPending.packageName}. Please complete or delete it from Payment History first.`);
                }

                // Force is TRUE: Check limits before creating new
                if (pendingCount >= 3) {
                    throw new Error('TO AVOID SPAMMING, LIMITS APPLIED! Let the previous payment request complete.');
                }
                if (planPendingCount >= 2) {
                    throw new Error('TO AVOID SPAMMING, LIMITS APPLIED! Maximum 2 requests allowed for this plan.');
                }

                // proceed to create new payment (no auto-expiry)
            }

            // Create payment document
            const paymentRef = this.db.collection('payments').doc();
            const now = admin.firestore.Timestamp.now();
            const expiresAt = new admin.firestore.Timestamp(
                now.seconds + (10 * 60), // 10 minutes
                now.nanoseconds
            );

            const paymentData = {
                paymentId: paymentRef.id,
                userId,
                userName: userInfo.name || 'Unknown',
                userEmail: userInfo.email || '',
                packageId,
                packageName: packageInfo.name,
                amount: packageInfo.price,
                tokenType: packageInfo.type,
                tokenAmount: packageInfo.amount,
                utr: null,
                status: 'pending',
                createdAt: now,
                submittedAt: null,
                expiresAt,
                processedAt: null,
                processedBy: null,
                adminNotes: null,
                ipAddress: metadata.ipAddress || null,
                userAgent: metadata.userAgent || null
            };

            await paymentRef.set(paymentData);

            return {
                success: true,
                paymentId: paymentRef.id,
                amount: packageInfo.price,
                expiresAt: expiresAt.toDate()
            };
        } catch (error) {
            console.error('Create payment error:', error);
            throw error;
        }
    }

    /**
     * Submit UTR for a payment
     */
    async submitUTR(userId, paymentId, utr) {
        try {
            // Validate UTR format (12 digits)
            if (!/^\d{12}$/.test(utr)) {
                throw new Error('UTR must be exactly 12 digits');
            }

            // Check if UTR already used
            const utrCheck = await this.db.collection('payments')
                .where('utr', '==', utr)
                .where('status', 'in', ['pending', 'approved'])
                .get();

            if (!utrCheck.empty) {
                throw new Error('This UTR has already been used');
            }

            // Get payment document
            const paymentRef = this.db.collection('payments').doc(paymentId);
            const paymentDoc = await paymentRef.get();

            if (!paymentDoc.exists) {
                throw new Error('Payment not found');
            }

            const payment = paymentDoc.data();

            // Verify ownership
            if (payment.userId !== userId) {
                throw new Error('Unauthorized');
            }

            // Check status
            if (payment.status !== 'pending') {
                throw new Error('Payment has already been processed');
            }

            // Check expiration
            const now = admin.firestore.Timestamp.now();
            if (payment.expiresAt.seconds < now.seconds) {
                await paymentRef.update({ status: 'expired' });
                throw new Error('Payment request has expired. Please create a new one.');
            }

            // Update with UTR
            await paymentRef.update({
                utr,
                submittedAt: now
            });

            return { success: true };
        } catch (error) {
            console.error('Submit UTR error:', error);
            throw error;
        }
    }

    /**
     * Get pending payments (admin only)
     */
    async getPendingPayments() {
        try {
            const snapshot = await this.db.collection('payments')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .get();

            const payments = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Only include payments with UTR submitted
                if (data.utr) {
                    payments.push({
                        ...data,
                        createdAt: data.createdAt?.toDate(),
                        submittedAt: data.submittedAt?.toDate(),
                        expiresAt: data.expiresAt?.toDate()
                    });
                }
            });

            // Sort by submittedAt (most recent first)
            payments.sort((a, b) => {
                if (!a.submittedAt) return 1;
                if (!b.submittedAt) return -1;
                return b.submittedAt - a.submittedAt;
            });

            return payments;
        } catch (error) {
            console.error('Get pending payments error:', error);
            throw error;
        }
    }

    /**
     * Approve payment and credit tokens (admin only)
     */
    async approvePayment(paymentId, adminUid, adminNotes = '') {
        try {
            // Use transaction to ensure atomicity
            return await this.db.runTransaction(async (transaction) => {
                const paymentRef = this.db.collection('payments').doc(paymentId);
                const paymentDoc = await transaction.get(paymentRef);

                if (!paymentDoc.exists) {
                    throw new Error('Payment not found');
                }

                const payment = paymentDoc.data();

                // Verify status
                if (payment.status !== 'pending') {
                    throw new Error('Payment has already been processed');
                }

                // Update payment status
                transaction.update(paymentRef, {
                    status: 'approved',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    processedBy: adminUid,
                    adminNotes
                });

                // Credit tokens to user
                const userRef = this.db.collection('users').doc(payment.userId);
                const tokenField = `tokens.${payment.tokenType}Tokens`;

                transaction.update(userRef, {
                    [tokenField]: admin.firestore.FieldValue.increment(payment.tokenAmount)
                });

                return { success: true };
            });
        } catch (error) {
            console.error('Approve payment error:', error);
            throw error;
        }
    }

    /**
     * Reject payment (admin only)
     */
    async rejectPayment(paymentId, adminUid, reason = '') {
        try {
            const paymentRef = this.db.collection('payments').doc(paymentId);
            const paymentDoc = await paymentRef.get();

            if (!paymentDoc.exists) {
                throw new Error('Payment not found');
            }

            const payment = paymentDoc.data();

            if (payment.status !== 'pending') {
                throw new Error('Payment has already been processed');
            }

            await paymentRef.update({
                status: 'rejected',
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: adminUid,
                adminNotes: reason
            });

            return { success: true };
        } catch (error) {
            console.error('Reject payment error:', error);
            throw error;
        }
    }

    /**
     * Get user's payment history
     */
    async getUserPayments(userId) {
        try {
            const snapshot = await this.db.collection('payments')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();

            const payments = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                payments.push({
                    paymentId: data.paymentId,
                    packageName: data.packageName,
                    amount: data.amount,
                    status: data.status,
                    utr: data.utr,
                    createdAt: data.createdAt?.toDate(),
                    submittedAt: data.submittedAt?.toDate(),
                    processedAt: data.processedAt?.toDate(),
                    adminNotes: data.adminNotes
                });
            });

            return payments;
        } catch (error) {
            console.error('Get user payments error:', error);
            throw error;
        }
    }

    /**
     * Delete a payment record (only for rejected/expired/approved payments)
     */
    async deletePayment(userId, paymentId) {
        try {
            const paymentRef = this.db.collection('payments').doc(paymentId);
            const paymentDoc = await paymentRef.get();

            if (!paymentDoc.exists) {
                throw new Error('Payment not found');
            }

            const payment = paymentDoc.data();

            // Verify ownership
            if (payment.userId !== userId) {
                throw new Error('Unauthorized');
            }

            // Allow deletion of any payment if user owns it
            // if (payment.status === 'pending') {
            //     throw new Error('Cannot delete pending payments');
            // }

            await paymentRef.delete();

            return { success: true };
        } catch (error) {
            console.error('Delete payment error:', error);
            throw error;
        }
    }
}
