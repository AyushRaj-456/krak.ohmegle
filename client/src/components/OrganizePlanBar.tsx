import React, { useState, useEffect } from 'react';
import { PlanCreationModal } from './PlanCreationModal';
import { EventsListModal } from './EventsListModal';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

import { auth } from '../firebase'; // Import auth to check guest status

interface OrganizePlanBarProps {
    userId: string;
    userName: string;
}

interface PlanEvent {
    id: string;
    topic: string;
    timestamp: Timestamp;
    creatorName: string;
    creatorId: string;
}

export const OrganizePlanBar: React.FC<OrganizePlanBarProps> = ({ userId, userName }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<PlanEvent[]>([]);
    const [timeLeft, setTimeLeft] = useState<string>('');

    const isGuest = auth.currentUser?.isAnonymous;

    // Fetch Events
    useEffect(() => {
        const plansRef = collection(db, 'organized_plans');

        // Fetch events from 30 mins ago onwards (to show currently happening events)
        const thirtyMinsAgo = Timestamp.fromMillis(Date.now() - 30 * 60 * 1000);

        const q = query(
            plansRef,
            where('timestamp', '>', thirtyMinsAgo),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PlanEvent[];
            setUpcomingEvents(events);
        });

        return () => unsubscribe();
    }, []);

    // Countdown Timer logic for the nearest event
    useEffect(() => {
        if (upcomingEvents.length === 0) {
            setTimeLeft('');
            return;
        }

        // IMPORTANT: The nearest event might be one that is currently happening (negative distance)
        // or one in the future. We sort by timestamp ASC, so [0] is the earliest.
        const targetTime = upcomingEvents[0].timestamp.toDate().getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            // If distance is neg but > -30 mins, it's LIVE.
            // If distance < -30 mins, it's expired (waiting for cleanup).
            if (distance < 0) {
                if (distance > -30 * 60 * 1000) {
                    setTimeLeft('LIVE NOW');
                } else {
                    setTimeLeft('Ended');
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            timeString += `${hours}h ${minutes}m ${seconds}s`;

            setTimeLeft(timeString);
        }, 1000);

        return () => clearInterval(timer);
    }, [upcomingEvents]);

    const nearestEvent = upcomingEvents[0];
    const eventCount = upcomingEvents.length;
    const isLive = timeLeft === 'LIVE NOW';

    return (
        <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* LEFT: Organize Button (50%) */}
                <div className="flex-1 relative group-container">
                    <button
                        onClick={() => !isGuest && setIsModalOpen(true)}
                        disabled={isGuest}
                        className={`group relative w-full h-full min-h-[100px] bg-gradient-to-br from-[#1a1a24] to-[#0f0f14] rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden ${isGuest ? 'cursor-not-allowed opacity-60 grayscale' : 'hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/10'}`}
                    >
                        {/* Hover glow effect (Only for non-guests) */}
                        {!isGuest && (
                            <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        )}

                        <div className={`relative z-10 flex items-center gap-3 ${isGuest ? 'blur-[2px]' : ''}`}>
                            <div className={`p-3 rounded-full bg-purple-500/10 text-purple-400 transition-all duration-300 ${!isGuest && 'group-hover:bg-purple-500/20 group-hover:scale-110'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <span className={`text-xl font-bold text-white transition-colors ${!isGuest && 'group-hover:text-purple-300'}`}>
                                Organize Plan
                            </span>
                        </div>
                        <p className={`relative z-10 text-gray-500 text-sm mt-2 text-center transition-colors ${!isGuest && 'group-hover:text-gray-400'} ${isGuest ? 'blur-[1px]' : ''}`}>
                            Schedule a meetup for the community
                        </p>

                        {/* Lock Overlay for Guests */}
                        {isGuest && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                <div className="p-3 bg-black/60 rounded-full border border-white/10 shadow-xl mb-2">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <span className="text-xs font-bold text-gray-300 bg-black/60 px-3 py-1 rounded-full border border-white/5">
                                    Login to organize (Reduces spam)
                                </span>
                            </div>
                        )}
                    </button>
                </div>

                {/* RIGHT: Upcoming Event Display (50%) */}
                <div className="flex-1 relative">
                    <div
                        onClick={() => eventCount > 0 && setIsListModalOpen(true)}
                        className={`w-full h-full min-h-[100px] backdrop-blur-md rounded-2xl border p-5 flex items-center shadow-lg relative overflow-hidden transition-all duration-500
                        ${isLive
                                ? 'bg-gradient-to-br from-green-900/20 to-black border-green-500/50 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] cursor-pointer animate-pulse-slow'
                                : 'bg-[#16161d]/80 border-white/5'
                            }
                        ${eventCount > 0 && !isLive ? 'cursor-pointer hover:bg-[#1f1f28] hover:border-white/10 group' : ''}
                        `}
                    >
                        {/* Event Count Badge (if > 1) */}
                        {eventCount > 1 && (
                            <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 animate-pulse z-20" title={`${eventCount} upcoming events`}>
                                {eventCount}
                            </div>
                        )}

                        {/* Hint to click (only on hover and if events exist) */}
                        {eventCount > 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[2px]">
                                <span className="text-white font-medium text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                    View All Events
                                </span>
                            </div>
                        )}

                        {nearestEvent ? (
                            <div className="w-full flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${isLive ? 'text-black bg-green-500 border-green-400 animate-pulse' : 'text-green-400 bg-green-500/10 border-green-500/20'}`}>
                                            {isLive ? 'LIVE NOW' : 'Upcoming'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            by {nearestEvent.creatorName}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-0.5 line-clamp-1">
                                        {nearestEvent.topic}
                                    </h3>
                                    <div className="text-sm text-gray-300 flex items-center gap-2">
                                        <span>
                                            {nearestEvent.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        {/* Show different text if LIVE */}
                                        {isLive ? (
                                            <span className="text-green-400 italic">Inform others to join!</span>
                                        ) : (
                                            <span>
                                                {nearestEvent.timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <div className={`text-2xl font-bold tabular-nums tracking-tight ${isLive ? 'text-green-400 scale-110 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-indigo-400 font-mono'}`}>
                                        {timeLeft || "---"}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                        {isLive ? 'Join Queue' : 'Starts In'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center text-center py-2">
                                <span className="text-gray-600 mb-1">
                                    <svg className="w-8 h-8 opacity-50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                                <span className="text-gray-500 font-medium">No upcoming plans</span>
                                <span className="text-xs text-gray-600">Be the first to organize one!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PlanCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {/* Toast or something could go here */ }}
                userId={userId}
                userName={userName}
            />

            <EventsListModal
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                events={upcomingEvents}
                currentUserId={userId}
            />
        </>
    );
};
