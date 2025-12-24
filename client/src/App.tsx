import React, { useEffect, useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { ProfileSetup } from './components/ProfileSetup';
import { HomePage } from './components/HomePage';
import { Room } from './components/Room';
import AlertModal from './components/AlertModal';
import type { MatchData, User, MatchPreferences, UserTokens } from './types';

const Main: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { currentUser, userProfile, loading: authLoading, signOut } = useAuth();

  // Token state
  const [tokens, setTokens] = useState<UserTokens>({
    freeTrialsRemaining: 5,
    regularTokens: 0,
    goldenTokens: 0
  });

  // Match state
  const [match, setMatch] = useState<(MatchData & { isInitiator?: boolean }) | null>(null);
  const [searching, setSearching] = useState(false);

  // View state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Match found
    socket.on('match_found', (data: MatchData & { isInitiator?: boolean }) => {
      console.log('Match found!', data);
      setSearching(false);
      setMatch(data);
    });

    // Token balance update
    socket.on('token_balance_update', (balance: UserTokens) => {
      console.log('Token balance updated:', balance);
      setTokens(balance);
    });

    // Insufficient tokens
    socket.on('insufficient_tokens', ({ message, balance }) => {
      setAlertMessage(message);
      setTokens(balance);
      setSearching(false);
    });

    // Purchase success
    socket.on('purchase_success', ({ tokenType, amount }) => {
      console.log(`Successfully purchased ${amount} ${tokenType} tokens`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Handle server disconnect
    });

    // Request initial token balance
    socket.emit('get_token_balance');

    // Login to sync with backend
    if (currentUser) {
      socket.emit('login', { uid: currentUser.uid });
    }

    return () => {
      socket.off('match_found');
      socket.off('token_balance_update');
      socket.off('insufficient_tokens');
      socket.off('purchase_success');
      socket.off('disconnect');
    };
  }, [socket, currentUser]);

  // Join room handler
  const handleJoinRoom = (preferences: MatchPreferences) => {
    if (!isConnected || !socket || !userProfile) {
      setAlertMessage("No connection to server or profile not set");
      return;
    }

    // Combine profile data with preferences
    const userData: User = {
      ...userProfile,
      mode: preferences.mode,
      mood: preferences.mood,
      filters: {
        branch: preferences.branch,
        gender: preferences.gender
      }
    };

    setSearching(true);
    socket.emit('join_queue', {
      ...userData,
      matchType: preferences.matchType || 'regular'
    });
  };

  // Token purchase handler (mock for now - will integrate payment gateway later)
  const handleBuyTokens = (packageId: string) => {
    if (!socket) return;

    // Mock purchase - in production, this would go through payment gateway
    console.log('Mock purchase:', packageId);

    // Simulate successful purchase
    const tokenMap: Record<string, { type: 'regular' | 'golden', amount: number }> = {
      'regular_10': { type: 'regular', amount: 10 },
      'regular_30': { type: 'regular', amount: 30 },
      'golden_5': { type: 'golden', amount: 5 }
    };

    const purchase = tokenMap[packageId];
    if (purchase) {
      socket.emit('add_tokens', purchase);
      setAlertMessage(`✅ Successfully purchased ${purchase.amount} ${purchase.type.toUpperCase()} tokens!`);
    }
  };

  // Leave/Cancel handler
  const handleLeave = () => {
    if (socket) {
      socket.emit('leave_queue');
    }
    setMatch(null);
    setSearching(false);
  };

  // Skip handler
  const handleSkip = () => {
    if (socket) socket.emit('skip');
    setMatch(null);
    setSearching(true);

    // Re-join with same preferences would require storing them
    // For now, return to home page
    setSearching(false);
  };

  // Sign off handler
  const handleSignOff = async () => {
    if (socket) {
      socket.emit('leave_queue');
      socket.disconnect();
    }
    setMatch(null);
    setSearching(false);
    setIsEditingProfile(false);
    setTokens({
      freeTrialsRemaining: 5,
      regularTokens: 0,
      goldenTokens: 0
    });
    // Sign out from Firebase (this will also clear userProfile in AuthContext)
    await signOut();
  };

  // Edit profile handler
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  // Profile completion handler
  const handleProfileComplete = () => {
    setIsEditingProfile(false);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  // Flow Logic
  // 1. Not authenticated → Show AuthPage
  if (!currentUser) {
    return <AuthPage onAuth={() => { }} />;
  }

  // 2. Authenticated but no profile OR editing profile → Show ProfileSetup
  if (!userProfile || isEditingProfile) {
    return (
      <ProfileSetup
        onComplete={handleProfileComplete}
        onClose={() => setIsEditingProfile(false)}
        initialData={userProfile || undefined}
        isEdit={isEditingProfile}
      />
    );
  }

  // 3. In a room → Show Room
  if (match && socket) {
    return (
      <Room
        socket={socket}
        user={{
          ...userProfile,
          mode: 'text', // This will be set from preferences
          filters: {}
        }}
        matchData={match}
        onLeave={handleLeave}
        onSkip={handleSkip}
      />
    );
  }

  const handleRefreshTokens = () => {
    if (socket) {
      socket.emit('get_token_balance');
    }
  };

  // 4. Searching for match → Show searching state
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-medium text-white mb-2">Finding a partner</h2>
          <p className="text-gray-500 text-sm mb-8">
            Please wait...
          </p>
          <button
            onClick={handleLeave}
            className="px-6 py-2 bg-[#16161d] hover:bg-[#1f1f28] text-gray-400 hover:text-white rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 5. Default → Show HomePage
  return (
    <>
      <HomePage
        profile={userProfile}
        tokens={tokens}
        onEditProfile={handleEditProfile}
        onSignOff={handleSignOff}
        onJoinRoom={handleJoinRoom}
        onBuyTokens={handleBuyTokens}
        onRefreshTokens={handleRefreshTokens}
        onAlert={setAlertMessage}
      />
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Main />
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
