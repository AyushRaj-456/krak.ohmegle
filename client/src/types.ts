// User profile data (mandatory fields)
export interface ProfileData {
    uid?: string; // Firebase UID
    email?: string; // User email
    name: string;
    branch: string;
    gender: string;
    year?: string; // Academic year (e.g., "1st Year", "2nd Year")
    bio?: string; // Short bio/description
    hobbies?: string[]; // List of hobbies/interests
    languages?: string[]; // List of languages spoken
    totalCalls?: number; // Total number of calls made
    seasonCalls?: number;
    totalTalkTime?: number; // Total duration of all calls in seconds
    longestCall?: number; // Duration of the longest call in seconds
    stats?: {
        genderMatches?: Record<string, number>;
        branchMatches?: Record<string, number>;
        moodMatches?: Record<string, number>;
        hobbyMatches?: Record<string, number>;
    };
    role?: 'user' | 'admin' | 'devbot';
    isGuest?: boolean;
}

// Match preferences (optional filters)
export interface MatchPreferences {
    branch?: string;
    gender?: string;
    language?: string;
    mood?: string;
    mode: 'text' | 'video';
    matchType?: 'regular' | 'golden'; // Premium matching
}

// Combined user data for queue
export interface User extends ProfileData {
    mode: 'text' | 'video';
    mood?: string;
    filters: {
        branch?: string;
        gender?: string;
    };
}

export interface QueuePayload extends User { }

export interface MatchData {
    partner: {
        name: string;
        branch: string;
        gender: string;
        isGuest?: boolean;
    };
    roomId: string;
}

export interface Message {
    sender: 'me' | 'partner' | 'system';
    text: string;
    timestamp: number;
}

// Token System Types
export interface UserTokens {
    freeTrialsRemaining: number;
    regularTokens: number;
    goldenTokens: number;  // Match with opposite gender
}

export interface TokenPackage {
    id: string;
    name: string;
    tokens: number;
    price: number;
    type: 'regular' | 'golden';
    description: string;
}


export type MatchType = 'regular' | 'golden';

export interface ServerStats {
    totalUsers: number;
    online: number;
    idle: number;
    onCall: number;
    queuing: number;
}
