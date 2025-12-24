import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { PaymentManager } from '../managers/PaymentManager.js';

const router = express.Router();
const paymentManager = new PaymentManager();

/**
 * USER ROUTES
 */

// Create payment request
router.post('/create', authenticateUser, async (req, res) => {
    try {
        const { packageId } = req.body;

        if (!packageId) {
            return res.status(400).json({ error: 'Package ID is required' });
        }

        const result = await paymentManager.createPayment(
            req.userId,
            packageId,
            {
                name: req.user.name,
                email: req.user.email
            },
            {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                force: req.body.force
            }
        );

        // Return payment details with QR code info
        res.json({
            ...result,
            qrCodeUrl: process.env.QR_CODE_URL || '/qr-code.png',
            upiId: process.env.UPI_ID || 'yourname@paytm'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Submit UTR
router.post('/submit-utr', authenticateUser, async (req, res) => {
    try {
        const { paymentId, utr } = req.body;

        if (!paymentId || !utr) {
            return res.status(400).json({
                error: 'Payment ID and UTR are required'
            });
        }

        const result = await paymentManager.submitUTR(
            req.userId,
            paymentId,
            utr
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user's payment history
router.get('/my-payments', authenticateUser, async (req, res) => {
    try {
        const payments = await paymentManager.getUserPayments(req.userId);
        res.json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete payment (only for rejected/expired/approved payments)
router.delete('/delete/:paymentId', authenticateUser, async (req, res) => {
    try {
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({ error: 'Payment ID is required' });
        }

        const result = await paymentManager.deletePayment(req.userId, paymentId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * ADMIN ROUTES
 */

// Get pending payments
router.get('/pending', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const payments = await paymentManager.getPendingPayments();
        res.json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve payment
router.post('/approve', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { paymentId, adminNotes } = req.body;

        if (!paymentId) {
            return res.status(400).json({ error: 'Payment ID is required' });
        }

        const result = await paymentManager.approvePayment(
            paymentId,
            req.userId,
            adminNotes || ''
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reject payment
router.post('/reject', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { paymentId, reason } = req.body;

        if (!paymentId) {
            return res.status(400).json({ error: 'Payment ID is required' });
        }

        const result = await paymentManager.rejectPayment(
            paymentId,
            req.userId,
            reason || 'No reason provided'
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
