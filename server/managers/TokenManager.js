class TokenManager {
    constructor() {
        // userId -> token data
        this.userTokens = new Map();
    }

    /**
     * Initialize a new user with 5 free trials
     */
    initializeUser(userId) {
        if (!this.userTokens.has(userId)) {
            this.userTokens.set(userId, {
                freeTrialsRemaining: 5,
                regularTokens: 0,
                goldenTokens: 0,
                totalChatsUsed: 0
            });
        }
        return this.userTokens.get(userId);
    }

    /**
     * Get user's token balance
     */
    getTokenBalance(userId) {
        return this.userTokens.get(userId) || this.initializeUser(userId);
    }

    /**
     * Check if user has available token for the match type
     */
    hasAvailableToken(userId, matchType = 'regular') {
        const tokens = this.getTokenBalance(userId);

        // Free trials can be used for regular matches only
        if (matchType === 'regular' && tokens.freeTrialsRemaining > 0) {
            return true;
        }

        // Check specific token type
        switch (matchType) {
            case 'regular':
                return tokens.regularTokens > 0;
            case 'golden':
                return tokens.goldenTokens > 0;
            default:
                return false;
        }
    }

    /**
     * Deduct token after successful match
     */
    deductToken(userId, matchType = 'regular') {
        const tokens = this.getTokenBalance(userId);

        // Use free trial first for regular matches
        if (matchType === 'regular' && tokens.freeTrialsRemaining > 0) {
            tokens.freeTrialsRemaining--;
            tokens.totalChatsUsed++;
            console.log(`User ${userId} used free trial. Remaining: ${tokens.freeTrialsRemaining}`);
            return { success: true, usedFreeTrial: true };
        }

        // Deduct specific token type
        switch (matchType) {
            case 'regular':
                if (tokens.regularTokens > 0) {
                    tokens.regularTokens--;
                    tokens.totalChatsUsed++;
                    console.log(`User ${userId} used regular token. Remaining: ${tokens.regularTokens}`);
                    return { success: true, usedFreeTrial: false };
                }
                break;
            case 'golden':
                if (tokens.goldenTokens > 0) {
                    tokens.goldenTokens--;
                    tokens.totalChatsUsed++;
                    console.log(`User ${userId} used Golden token. Remaining: ${tokens.goldenTokens}`);
                    return { success: true, usedFreeTrial: false };
                }
                break;
        }

        return { success: false, error: 'Insufficient tokens' };
    }

    /**
     * Refund token (for failed matches)
     */
    refundToken(userId, matchType, usedFreeTrial) {
        const tokens = this.getTokenBalance(userId);
        if (usedFreeTrial) {
            tokens.freeTrialsRemaining++;
            tokens.totalChatsUsed--; // Revert usage stat too
        } else {
            switch (matchType) {
                case 'regular':
                    tokens.regularTokens++;
                    tokens.totalChatsUsed--;
                    break;
                case 'golden':
                    tokens.goldenTokens++;
                    tokens.totalChatsUsed--;
                    break;
            }
        }
        console.log(`Refunded ${matchType} token (FreeTrial: ${usedFreeTrial}) to user ${userId}`);
        return tokens;
    }

    /**
     * Add tokens to user account (after purchase)
     */
    addTokens(userId, tokenType, amount) {
        const tokens = this.getTokenBalance(userId);

        switch (tokenType) {
            case 'regular':
                tokens.regularTokens += amount;
                break;
            case 'golden':
                tokens.goldenTokens += amount;
                break;
        }

        console.log(`Added ${amount} ${tokenType} tokens to user ${userId}`);
        return tokens;
    }

    /**
     * Get all users' token data (for admin/analytics)
     */
    /**
     * Set user's token balance (from Firestore sync)
     */
    setUserBalance(userId, tokenData) {
        // Ensure we preserve the structure even if partial data comes
        this.userTokens.set(userId, {
            freeTrialsRemaining: tokenData.freeTrialsRemaining || 0,
            regularTokens: tokenData.regularTokens || 0,
            goldenTokens: tokenData.goldenTokens || 0,
            totalChatsUsed: tokenData.totalChatsUsed || 0
        });
        return this.userTokens.get(userId);
    }

    getAllUsersTokens() {
        const allTokens = {};
        for (const [userId, tokens] of this.userTokens.entries()) {
            allTokens[userId] = tokens;
        }
        return allTokens;
    }
}

export default TokenManager;
