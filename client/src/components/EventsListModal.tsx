import React, { useState } from 'react';
import { db } from '../firebase';
import { deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface PlanEvent {
    id: string;
    topic: string;
    timestamp: Timestamp;
    creatorName: string;
    creatorId: string;
    upvotedBy?: string[];
    downvotedBy?: string[];
}

interface EventsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: PlanEvent[];
    currentUserId: string;
    onVote: (e: React.MouseEvent, eventId: string, type: 'up' | 'down') => void;
}

export const EventsListModal: React.FC<EventsListModalProps> = ({ isOpen, onClose, events, currentUserId, onVote }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (eventId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(eventId);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;

        setDeletingId(confirmDeleteId);
        try {
            await deleteDoc(doc(db, 'organized_plans', confirmDeleteId));
        } catch (error) {
            console.error("Error deleting plan:", error);
            // Optional: Add a toast error here
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-[#16161d] rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-white/10 shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Confirmation Overlay */}
                {confirmDeleteId && (
                    <div className="absolute inset-0 z-20 bg-[#16161d]/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center w-full max-w-sm">
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Event?</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 px-4">
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="flex-1 py-2.5 px-4 bg-[#232329] hover:bg-[#2c2c35] text-gray-300 rounded-lg font-semibold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={!!deletingId}
                                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                                >
                                    {deletingId ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Yes, Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#16161d] z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                        <p className="text-gray-400 text-xs mt-1">
                            {events.length} {events.length === 1 ? 'event' : 'events'} scheduled
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {events.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No upcoming events found.
                        </div>
                    ) : (
                        events.map(event => {
                            const isOwner = event.creatorId === currentUserId;
                            const eventTime = event.timestamp.toDate();

                            return (
                                <div
                                    key={event.id}
                                    className="bg-[#0f0f14] p-4 rounded-xl border border-white/5 hover:border-purple-500/20 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                                {eventTime.toLocaleDateString(undefined, { weekday: 'short' })}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">
                                                by {event.creatorName}
                                            </span>
                                            {isOwner && (
                                                <span className="text-[10px] text-gray-500 border border-gray-700 px-1 rounded">
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-white font-medium truncate mb-0.5">
                                            {event.topic}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {eventTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    {/* Voting Actions for List Item */}
                                    <div className="flex items-center gap-3 mr-4 border-r border-white/5 pr-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={(e) => onVote(e, event.id, 'up')}
                                                disabled={!currentUserId}
                                                className={`p-2 rounded-full transition-all duration-300 ${event.upvotedBy?.includes(currentUserId)
                                                        ? 'bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.6)] scale-110 ring-1 ring-white/20'
                                                        : 'text-gray-500 hover:text-[#4ade80] hover:bg-[#22c55e]/10'
                                                    }`}
                                                title="Upvote"
                                            >
                                                <svg className="w-5 h-5" fill={event.upvotedBy?.includes(currentUserId) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                            </button>
                                            <span className={`text-[10px] font-bold ${event.upvotedBy && event.upvotedBy.length > 0 ? 'text-[#4ade80]' : 'text-gray-600'}`}>
                                                {event.upvotedBy?.length || 0}
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={(e) => onVote(e, event.id, 'down')}
                                                disabled={!currentUserId}
                                                className={`p-2 rounded-full transition-all duration-300 ${event.downvotedBy?.includes(currentUserId)
                                                        ? 'bg-[#ef4444] text-black shadow-[0_0_10px_rgba(239,68,68,0.6)] scale-110 ring-1 ring-white/20'
                                                        : 'text-gray-500 hover:text-[#f87171] hover:bg-[#ef4444]/10'
                                                    }`}
                                                title="Downvote"
                                            >
                                                <svg className="w-5 h-5" fill={event.downvotedBy?.includes(currentUserId) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                                            </button>
                                            <span className={`text-[10px] font-bold ${event.downvotedBy && event.downvotedBy.length > 0 ? 'text-[#f87171]' : 'text-gray-600'}`}>
                                                {event.downvotedBy?.length || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {isOwner && (
                                        <button
                                            onClick={(e) => handleDeleteClick(event.id, e)}
                                            className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete Event"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
