export class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> { user1, user2 }
    }

    createRoom(user1, user2) {
        const roomId = `${user1.id}-${user2.id}`;
        this.rooms.set(roomId, {
            user1,
            user2,
            startTime: Date.now()
        });

        user1.processMatch(user2, roomId, true);
        user2.processMatch(user1, roomId, false);

        console.log(`Room created: ${roomId} for ${user1.name} and ${user2.name}`);
    }

    handleDisconnect(userId) {
        // Find room where user is present
        for (const [roomId, room] of this.rooms) {
            if (room.user1.id === userId || room.user2.id === userId) {
                const partner = room.user1.id === userId ? room.user2 : room.user1;

                // Calculate duration
                const duration = (Date.now() - room.startTime) / 1000;

                partner.socket.emit('partner_disconnected');
                this.rooms.delete(roomId);

                return { duration, user1: room.user1, user2: room.user2 };
            }
        }
        return null;
    }

    getRoomCount() {
        return this.rooms.size;
    }

    // We can add signaling methods here if we want centralized handling,
    // or let users emit directly to partners via roomId.
    // Centralized is safer for logging/control.
}
