import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Ensure firebase is exported from your config
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface PlanCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    userName: string;
}

export const PlanCreationModal: React.FC<PlanCreationModalProps> = ({ isOpen, onClose, onSuccess, userId, userName }) => {
    const [topic, setTopic] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Date Logic state
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            calculateDateRange();
            setTopic('');
            setSelectedDate('');
            setSelectedTime('');
            setError('');
        }
    }, [isOpen]);

    const calculateDateRange = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        setMinDate(`${yyyy}-${mm}-${dd}`);

        // Logic: specific rule from user
        // "if today is saturday then unlocked event days will be from today to upcoming sunday(after 7-8 days i guess)"

        // Find next Sunday
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        const daysUntilSunday = 7 - dayOfWeek; // e.g. Mon(1) -> 6 days diff -> Sunday

        let targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntilSunday); // This is the *immediate* next Sunday

        // Check if we are in the "weekend buffer" (Sat/Sun) to extend to the *following* week
        // User example: Saturday -> next Sunday (8 days). 
        // If today is Sat (6), next Sun is tomorrow (+1). +7 days = 8 days total. Correct.
        if (dayOfWeek === 6 || dayOfWeek === 0) {
            targetDate.setDate(targetDate.getDate() + 7);
        }

        const max_yyyy = targetDate.getFullYear();
        const max_mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const max_dd = String(targetDate.getDate()).padStart(2, '0');
        setMaxDate(`${max_yyyy}-${max_mm}-${max_dd}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime || !topic.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Construct timestamp
            const eventDateTime = new Date(`${selectedDate}T${selectedTime}`);

            // Basic validation
            if (eventDateTime < new Date()) {
                setError('Event time cannot be in the past!');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, 'organized_plans'), {
                topic: topic.trim(),
                timestamp: Timestamp.fromDate(eventDateTime),
                creatorId: userId,
                creatorName: userName || 'Anonymous',
                createdAt: Timestamp.now()
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating plan:', err);
            setError('Failed to create plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#16161d] rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Organize a Plan</h2>
                    <p className="text-gray-400 text-sm">Schedule a meetup for the community.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-1.5">What's the plan?</label>
                        <input
                            type="text"
                            placeholder="e.g. Mass Omegle Raid, Late Night Chats..."
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            className="w-full bg-[#0f0f14] border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                            maxLength={50}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1.5">Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                min={minDate}
                                max={maxDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full bg-[#0f0f14] border border-white/5 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1.5">Time</label>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={e => setSelectedTime(e.target.value)}
                                className="w-full bg-[#0f0f14] border border-white/5 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Scheduling...' : 'Create Event'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Event will be visible to all users until it expires.
                    </p>
                </form>
            </div>
        </div>
    );
};
