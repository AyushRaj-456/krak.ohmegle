export class QueueManager {
    constructor() {
        // Regular queues
        this.textQueue = [];
        this.videoQueue = [];

        // Premium golden queues - opposite gender matching
        this.goldenTextQueue = [];
        this.goldenVideoQueue = [];
    }

    addUser(user, matchType = 'regular') {
        // Select appropriate queue based on match type and mode
        let queue;

        if (matchType === 'golden') {
            // Golden: Match with opposite gender only
            queue = this.goldenVideoQueue;
        } else {
            // Regular matching
            queue = this.videoQueue;
        }

        // Try to find a match
        const matchIndex = queue.findIndex(potentialMatch =>
            this.isMatch(user, potentialMatch, matchType)
        );

        if (matchIndex !== -1) {
            const match = queue.splice(matchIndex, 1)[0];
            return match;
        }

        // No match found, add to queue
        queue.push(user);
        return null;
    }

    removeUser(userId) {
        // Remove from all queues
        this.textQueue = this.textQueue.filter(u => u.id !== userId);
        this.videoQueue = this.videoQueue.filter(u => u.id !== userId);
        this.goldenTextQueue = this.goldenTextQueue.filter(u => u.id !== userId);
        this.goldenVideoQueue = this.goldenVideoQueue.filter(u => u.id !== userId);
    }

    isMatch(user1, user2, matchType = 'regular') {
        // Prevent matching with self
        if (user1.id === user2.id) return false;

        // Golden matching logic - opposite gender only
        if (matchType === 'golden') {
            // Ensure users are of opposite gender
            if (user1.gender === user2.gender) return false;
            // Both must have different genders (Male-Female or Female-Male)
            const validPairs = [
                (user1.gender === 'Male' && user2.gender === 'Female'),
                (user1.gender === 'Female' && user2.gender === 'Male')
            ];
            if (!validPairs.some(pair => pair)) return false;
        }

        // Regular matching - check branch and gender preferences
        if (user1.filters.branch && user1.filters.branch !== user2.branch) return false;
        if (user2.filters.branch && user2.filters.branch !== user1.branch) return false;

        if (user1.filters.gender && user1.filters.gender !== user2.gender) return false;
        if (user2.filters.gender && user2.filters.gender !== user1.gender) return false;

        return true;
    }

    // Get queue stats (for debugging/analytics)
    getQueueStats() {
        return {
            text: this.textQueue.length,
            video: this.videoQueue.length,
            goldenText: this.goldenTextQueue.length,
            goldenVideo: this.goldenVideoQueue.length,
            total: this.textQueue.length + this.videoQueue.length +
                this.goldenTextQueue.length + this.goldenVideoQueue.length
        };
    }
}
