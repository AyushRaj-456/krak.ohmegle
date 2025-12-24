import admin from 'firebase-admin';

/**
 * Authentication middleware
 * Verifies Firebase token and extracts user info
 */
export async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No authentication token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.userId = decodedToken.uid;

        // Get user document from Firestore
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(decodedToken.uid)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'User profile not found'
            });
        }

        req.user = userDoc.data();
        // Default to 'user' role if not specified
        req.userRole = req.user.role || 'user';

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}

/**
 * Admin authorization middleware
 * Must be used after authenticateUser
 */
export function requireAdmin(req, res, next) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            error: 'Admin access required'
        });
    }
    next();
}
