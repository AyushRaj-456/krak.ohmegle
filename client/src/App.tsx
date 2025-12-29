// @ts-nocheck
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
  // Project Sunset Overlay - Backend Suspended (Blocks Everything)
  // Return immediately to prevent any other logic/hooks from running or rendering
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred Background with AuthPage */}
      <div className="absolute inset-0 z-0 blur-sm pointer-events-none">
        <AuthPage onAuth={() => { }} />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-[9999] bg-black/60 flex items-center justify-center p-6 animate-in fade-in duration-1000">
        <div className="text-center space-y-8 max-w-4xl relative p-12 rounded-3xl border border-purple-500/30 bg-black/40 backdrop-blur-3xl shadow-2xl shadow-purple-500/10">
          {/* Background Glow inside the card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/10 rounded-3xl blur-3xl -z-10"></div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-500 tracking-wider font-mono drop-shadow-2xl">
              Backend Server has been stopped
            </h1>
            <span className="text-sm md:text-base text-gray-600 font-medium">
              (by developer)
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl md:text-3xl text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto">
              The developer can’t afford a $50/month backend server 🥺💔
            </h2>
          </div>

          <div className="pt-8 flex flex-col items-center gap-8">
            <button
              onClick={() => window.location.href = 'https://www.google.com'}
              className="group relative px-8 py-4 bg-[#0f0f14] hover:bg-[#1a1a24] text-white font-bold rounded-2xl border border-white/10 hover:border-purple-500/50 shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-3 text-lg">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Website
              </span>
            </button>

            <p className="text-orange-500 font-mono text-sm tracking-wide font-medium opacity-90">
              Have a great day ahead - KRAK(Σ)N
            </p>
          </div>
        </div>
      </div>
    </div>
  );

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
  const [partnerDisconnected, setPartnerDisconnected] = useState<{ reason: string } | null>(null);

  // View state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Store last match preferences for auto-requeuing
  const [lastMatchPreferences, setLastMatchPreferences] = useState<MatchPreferences | null>(null);

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

    // Partner disconnected
    socket.on('partner_disconnected', ({ reason }) => {
      console.log('Partner disconnected:', reason);
      setPartnerDisconnected({ reason });
      setMatch(null);
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
      socket.off('partner_disconnected');
      socket.off('disconnect');
    };
  }, [socket, currentUser]);

  // Join room handler
  const handleJoinRoom = (preferences: MatchPreferences) => {
    if (!isConnected || !socket || !userProfile) {
      setAlertMessage("No connection to server or profile not set");
      return;
    }

    // Save preferences for re-queueing (Skip/Search New)
    setLastMatchPreferences(preferences);

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
      if (match) {
        socket.emit('stop_call');
      } else {
        socket.emit('leave_queue');
      }
    }
    setMatch(null);
    setSearching(false);
    setPartnerDisconnected(null);
  };

  // Skip handler
  const handleSkip = () => {
    if (socket) socket.emit('skip');
    setMatch(null);
    setPartnerDisconnected(null);

    // Auto-search: Immediately join queue again with last preferences
    if (lastMatchPreferences) {
      handleJoinRoom(lastMatchPreferences);
    } else {
      // Fallback if no preferences found (shouldn't happen in normal flow)
      setSearching(false);
    }
  };

  const handleSearchNew = () => {
    setPartnerDisconnected(null);
    setMatch(null);

    if (lastMatchPreferences) {
      handleJoinRoom(lastMatchPreferences);
    } else {
      setSearching(false);
    }
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
        key={match.roomId}
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

      {partnerDisconnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#16161d] p-6 rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {partnerDisconnected.reason === 'skip' ? 'Partner Skipped' : 'Call Ended'}
              </h3>
              <p className="text-gray-400 mb-6">
                {partnerDisconnected.reason === 'skip'
                  ? 'Your partner decided to skip this match.'
                  : 'Your partner has ended the call.'}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSearchNew}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  Search New Partner
                </button>
                <button
                  onClick={handleLeave}
                  className="w-full py-3 px-4 bg-[#232329] hover:bg-[#2c2c35] text-gray-300 rounded-xl font-medium transition-all"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
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
