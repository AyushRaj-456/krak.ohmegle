import { QueueManager } from './QueueManager.js';
import { RoomManager } from './RoomManager.js';
import TokenManager from './TokenManager.js';
import admin from 'firebase-admin';

export class UserManager {
    constructor() {
        this.users = new Map();
        this.queueManager = new QueueManager();
        this.roomManager = new RoomManager();
        this.tokenManager = new TokenManager();

        // Initialize Firestore for user counting
        this.db = admin.firestore();
        this.totalUsers = 0;

        // Real-time listener for user count
        this.setupUserCountListener();
    }

    setupUserCountListener() {
        try {
            // Note: listening to the entire collection can be expensive at scale.
            // For production with many users, consider distributed counters or periodic aggregation.
            this.db.collection('users').onSnapshot(
                (snapshot) => {
                    // console.debug(`[UserManager] Firestore snapshot update: ${snapshot.size} users`);
                    this.totalUsers = snapshot.size;
                },
                (error) => {
                    console.error('Error listening to user count:', error);
                }
            );
        } catch (error) {
            console.error('Failed to setup user count listener:', error);
        }
    }

    handleConnection(socket) {
        // Initialize user tokens on connection
        this.tokenManager.initializeUser(socket.id);

        // Initialize user in map immediately to handle login/disconnect safely
        if (!this.users.has(socket.id)) {
            this.users.set(socket.id, { socket, id: socket.id });
        }

        // Login event to sync socket with Firestore UID
        socket.on('login', async ({ uid }) => {
            console.log(`User logged in with UID: ${uid} (Socket: ${socket.id})`);

            // Map socket to UID (Safe now because we initialized above)
            const user = this.users.get(socket.id);
            if (user) {
                user.uid = uid;
            }

            // Fetch initial data from Firestore
            try {
                const userRef = this.db.collection('users').doc(uid);
                const doc = await userRef.get();

                if (doc.exists) {
                    const data = doc.data();
                    if (data.tokens) {
                        this.tokenManager.setUserBalance(socket.id, data.tokens);
                        socket.emit('token_balance_update', data.tokens);
                    }
                }

                // Setup realtime listener for this user
                const unsubscribe = userRef.onSnapshot(snapshot => {
                    if (snapshot.exists) {
                        const newData = snapshot.data();
                        if (newData.tokens) {
                            console.log(`Realtime token update for ${uid}:`, newData.tokens);
                            this.tokenManager.setUserBalance(socket.id, newData.tokens);
                            socket.emit('token_balance_update', newData.tokens);
                        }
                    }
                }, err => {
                    console.error(`Error listening to user ${uid}:`, err);
                });

                // Store unsubscribe function to clean up later
                if (!socket.firestoreUnsubscribe) {
                    socket.firestoreUnsubscribe = [];
                }
                socket.firestoreUnsubscribe.push(unsubscribe);

            } catch (err) {
                console.error(`Error syncing user ${uid}:`, err);
            }
        });

        socket.on('join_queue', ({ name, branch, gender, mode, filters, matchType = 'regular', mood, hobbies }) => {
            // Validate token availability
            // TEMPORARY: Disabled token check for unlimited access
            /*
            if (!this.tokenManager.hasAvailableToken(socket.id, matchType)) {
                socket.emit('insufficient_tokens', {
                    message: 'You need tokens to join a room',
                    balance: this.tokenManager.getTokenBalance(socket.id)
                });
                return;
            }
            */

            // Merge with existing user data (preserving uid/socket)
            const existingUser = this.users.get(socket.id) || { socket, id: socket.id };

            const user = {
                ...existingUser, // Keep socket, uid, etc.
                name,
                branch,
                gender,
                mode,
                filters: filters || {},
                matchType,
                mood,
                hobbies,
                processMatch: (partner, roomId, isInitiator) => {
                    socket.join(roomId);
                    socket.emit('match_found', {
                        partner: {
                            name: partner.name,
                            branch: partner.branch,
                            gender: partner.gender
                        },
                        roomId,
                        isInitiator
                    });
                }
            };

            this.users.set(socket.id, user);

            console.log(`User ${name} joined ${mode} queue (${matchType} match)`);

            const match = this.queueManager.addUser(user, matchType);
            if (match) {
                // Deduct tokens from both users
                const user1Result = this.tokenManager.deductToken(socket.id, matchType);
                const user2Result = this.tokenManager.deductToken(match.id, match.matchType || 'regular');

                if (user1Result.success && user2Result.success) {
                    // Create room
                    this.roomManager.createRoom(user, match);

                    // Send updated token balance to both users
                    socket.emit('token_balance_update', this.tokenManager.getTokenBalance(socket.id));
                    match.socket.emit('token_balance_update', this.tokenManager.getTokenBalance(match.id));

                    console.log(`Match created! Tokens deducted from both users.`);
                } else {
                    // Handle failure gracefully
                    console.log('Token deduction failed during match creation. Rolling back.');

                    // Return innocent parties to queue
                    if (user1Result.success) {
                        this.tokenManager.refundToken(socket.id, matchType, user1Result.usedFreeTrial);
                    }
                    if (user2Result.success) {
                        this.tokenManager.refundToken(match.id, match.matchType || 'regular', user2Result.usedFreeTrial);
                        this.queueManager.addUser(match, match.matchType);
                    }

                    // Notify failures
                    if (!user1Result.success) {
                        socket.emit('insufficient_tokens', { message: 'Insufficient tokens to complete match.', balance: this.tokenManager.getTokenBalance(socket.id) });
                    } else {
                        socket.emit('match_error', { message: 'Partner failed to connect. Searching again...' });
                        this.queueManager.addUser(user, matchType); // Re-queue us if we were innocent
                    }

                    if (!user2Result.success) {
                        match.socket.emit('insufficient_tokens', { message: 'Insufficient tokens to complete match.', balance: this.tokenManager.getTokenBalance(match.id) });
                    } else {
                        match.socket.emit('match_error', { message: 'Partner failed to connect. Searching again...' });
                        // match was already re-queued above
                    }
                }
            }
        });

        socket.on('leave_queue', () => {
            console.log(`User ${socket.id} leaving queue (keeping connection)`);
            this.queueManager.removeUser(socket.id);
        });

        socket.on('stop_call', () => {
            // User explicitly clicked "Stop"
            const roomResult = this.roomManager.handleDisconnect(socket.id, 'stop');
            if (roomResult) {
                const { duration, user1, user2 } = roomResult;
                if (duration > 0) {
                    if (user1 && user1.uid) this.updateUserStats(user1.uid, duration, user2);
                    if (user2 && user2.uid) this.updateUserStats(user2.uid, duration, user1);
                }
            }
        });

        // Get token balance
        socket.on('get_token_balance', () => {
            const balance = this.tokenManager.getTokenBalance(socket.id);
            socket.emit('token_balance_update', balance);
        });

        // Purchase tokens (will be called after payment verification)
        socket.on('add_tokens', ({ tokenType, amount }) => {
            const balance = this.tokenManager.addTokens(socket.id, tokenType, amount);
            socket.emit('token_balance_update', balance);
            socket.emit('purchase_success', { tokenType, amount });
        });

        // Signaling Events
        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', offer);
        });

        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', answer);
        });

        socket.on('ice_candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('ice_candidate', candidate);
        });

        socket.on('message', ({ roomId, message }) => {
            socket.to(roomId).emit('message', message);
        });

        socket.on('skip', () => {
            // Note: Token already deducted when match was made
            // Skip doesn't refund the token
            const roomResult = this.roomManager.handleDisconnect(socket.id, 'skip');
            if (roomResult) {
                const { duration, user1, user2 } = roomResult;
                if (duration > 0) {
                    if (user1 && user1.uid) this.updateUserStats(user1.uid, duration, user2);
                    if (user2 && user2.uid) this.updateUserStats(user2.uid, duration, user1);
                }
            }
        });
    }

    async updateUserStats(uid, duration, partner) {
        if (!uid || duration <= 0) return;

        try {
            const userRef = this.db.collection('users').doc(uid);

            // Prepare update data
            const updateData = {
                totalCalls: admin.firestore.FieldValue.increment(1),
                totalTalkTime: admin.firestore.FieldValue.increment(duration),
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            };

            // We need a transaction to check longestCall (can't do max with FieldValue)
            // But for simple counters, we can use increment.
            // For complexity, let's keep the transaction for longestCall, but mix in new stats.

            await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                if (!doc.exists) return;

                const data = doc.data();
                const newLongestCall = Math.max(data.longestCall || 0, duration);

                // Nested updates
                const changes = {
                    totalCalls: (data.totalCalls || 0) + 1,
                    seasonCalls: (data.seasonCalls || 0) + 1,
                    totalTalkTime: (data.totalTalkTime || 0) + duration,
                    longestCall: newLongestCall,
                    lastActive: admin.firestore.FieldValue.serverTimestamp()
                };

                // Add stats if partner data exists
                if (partner) {
                    // Initialize stats if missing (done in client, but be safe)
                    // Note: Firestore nested updates need dot notation for specific fields to avoid overwriting map
                    // BUT we are reading the whole object, so we can modify the object and write it back.
                    // Or construct specific update keys.

                    const stats = data.stats || {
                        genderMatches: {},
                        branchMatches: {},
                        moodMatches: {},
                        hobbyMatches: {}
                    };

                    // Helper to increment map value
                    const inc = (map, key) => {
                        if (!key) return;
                        map[key] = (map[key] || 0) + 1;
                    };

                    inc(stats.genderMatches, partner.gender);
                    inc(stats.branchMatches, partner.branch);
                    inc(stats.moodMatches, partner.mood);

                    if (Array.isArray(partner.hobbies)) {
                        partner.hobbies.forEach(h => inc(stats.hobbyMatches, h));
                    }

                    changes.stats = stats;
                }

                transaction.update(userRef, changes);
            });
            console.log(`Updated stats for ${uid} with partner ${partner ? partner.id : 'unknown'}`);
        } catch (error) {
            console.error(`Error updating stats for ${uid}:`, error);
        }
    }

    handleDisconnect(socketId) {
        // Clean up Firestore listeners
        const user = this.users.get(socketId);
        if (user && user.socket && user.socket.firestoreUnsubscribe) {
            user.socket.firestoreUnsubscribe.forEach(unsub => unsub());
            console.log(`Cleaned up listeners for ${socketId}`);
        }

        this.users.delete(socketId);
        this.queueManager.removeUser(socketId);

        const roomResult = this.roomManager.handleDisconnect(socketId, 'disconnect');
        if (roomResult) {
            const { duration, user1, user2 } = roomResult;
            if (duration > 0) {
                if (user1 && user1.uid) this.updateUserStats(user1.uid, duration, user2);
                if (user2 && user2.uid) this.updateUserStats(user2.uid, duration, user1);
            }
        }
    }

    getStats() {
        const totalOnline = this.users.size;
        const queueStats = this.queueManager.getQueueStats();
        const onQueue = queueStats.total;
        const onCall = this.roomManager.getRoomCount() * 2;

        // Idle = Total - Queue - Call
        // Ensure non-negative (just in case of race conditions)
        const idle = Math.max(0, totalOnline - onQueue - onCall);

        return {
            totalUsers: this.totalUsers,
            online: totalOnline,
            idle,
            onCall,
            queuing: onQueue
        };
    }
}
