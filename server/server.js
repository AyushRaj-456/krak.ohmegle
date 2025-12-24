import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production: Load from environment variable
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
        process.exit(1);
    }
} else {
    // Development: Load from local file
    try {
        serviceAccount = JSON.parse(
            readFileSync('./serviceAccountKey.json', 'utf8')
        );
    } catch (error) {
        console.warn('⚠️ Service account file not found or invalid. Firebase features may fail.');
    }
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
}

const app = express();
const httpServer = createServer(app);

// Update CORS for production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL, // e.g. https://krak-ohmegle.vercel.app
].filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*"
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('SIT Omegle Server Running');
});

// Dynamically import payment routes AFTER Firebase is initialized
const paymentRoutes = await import('./routes/payments.js');
app.use('/api/payments', paymentRoutes.default);

// Managers will be imported here
import { UserManager } from './managers/UserManager.js';
import { RoomManager } from './managers/RoomManager.js';

const userManager = new UserManager();
const roomManager = new RoomManager();

// Emit server stats every 5 seconds
setInterval(() => {
    const stats = userManager.getStats();
    io.emit('server_stats', stats);
}, 5000);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    userManager.handleConnection(socket);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        userManager.handleDisconnect(socket.id);
        roomManager.handleDisconnect(socket.id);
    });

    // Pass socket events to managers
    // We will structure this better inside UserManager or specialized handlers
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
