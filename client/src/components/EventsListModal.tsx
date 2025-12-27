import React, { useState } from 'react';
import { db } from '../firebase';
import { deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface PlanEvent {
    id: string;
    topic: string;
    timestamp: Timestamp;
    creatorName: string;
    creatorId: string;
}

interface EventsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: PlanEvent[];
    currentUserId: string;
}

export const EventsListModal: React.FC<EventsListModalProps> = ({ isOpen, onClose, events, currentUserId }) => {
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
