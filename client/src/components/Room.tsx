import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { MatchData, Message, User } from '../types';
import { ReportModal } from './ReportModal';

interface RoomProps {
    socket: Socket;
    user: User;
    matchData: MatchData & { isInitiator?: boolean };
    onLeave: () => void;
    onSkip: () => void;
}

const SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
};

const logWithTime = (...args: any[]) => {
    console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}]`, ...args);
};



export const Room: React.FC<RoomProps> = ({ socket, matchData, onLeave, onSkip, user }) => {
    // Chat Toggle State
    // Default chat to OPEN if in text mode
    const [isChatOpen, setIsChatOpen] = useState(user.mode === 'text');
    const [partnerChatOpen, setPartnerChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Existing State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [partnerDisconnected, setPartnerDisconnected] = useState(false);
    const [canReconnect, setCanReconnect] = useState(false); // Delay state
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // WebRTC Refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const pendingCandidates = useRef<RTCIceCandidate[]>([]);
    const pendingOffer = useRef<any>(null);

    // Ref for current chat state
    const isChatOpenRef = useRef(isChatOpen);
    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);

    useEffect(() => {
        // Handle Chat Status Sync
        socket.on('chat_status', (status: { isOpen: boolean }) => {
            console.log("Partner chat status:", status.isOpen);
            setPartnerChatOpen(status.isOpen);
        });

        // Emit initial status
        socket.emit('chat_status', { roomId: matchData.roomId, isOpen: user.mode === 'text' });

        // Handle Disconnect
        socket.on('partner_disconnected', () => {
            setPartnerDisconnected(true);
            setMessages(prev => [...prev, { sender: 'system', text: 'Partner disconnected.', timestamp: Date.now() }]);
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
            setCanReconnect(false);
            setTimeout(() => {
                setCanReconnect(true);
            }, 2000);
        });

        socket.on('message', (msg: { text: string }) => {
            setMessages(prev => [...prev, { sender: 'partner', text: msg.text, timestamp: Date.now() }]);
            if (!isChatOpenRef.current && user.mode !== 'text') {
                setUnreadCount(prev => prev + 1);
            }
        });

        // WebRTC Signals - Only process if in Video Mode
        if (user.mode === 'video') {
            socket.on('offer', async (offer) => {
                console.log("Received offer");
                if (!peerRef.current) {
                    console.log("Peer not ready, queueing offer");
                    pendingOffer.current = offer;
                    return;
                }
                if (isNegotiating.current) {
                    return;
                }
                isNegotiating.current = true;
                try {
                    // Check if peer exists, else wait or re-init (though it should be handled by setupWebRTC call)
                    if (!peerRef.current) {
                        // Should not happen if logic is correct, but safe guard
                        return;
                    }

                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await peerRef.current.createAnswer();
                    await peerRef.current.setLocalDescription(answer);
                    socket.emit('answer', { roomId: matchData.roomId, answer });
                    pendingCandidates.current.forEach(c => peerRef.current?.addIceCandidate(c));
                    pendingCandidates.current = [];
                } catch (err) {
                    console.error("Error handling offer:", err);
                } finally {
                    isNegotiating.current = false;
                }
            });

            socket.on('answer', async (answer) => {
                console.log("Received answer");
                if (!peerRef.current) return;
                try {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    pendingCandidates.current.forEach(c => peerRef.current?.addIceCandidate(c));
                    pendingCandidates.current = [];
                } catch (err) {
                    console.error("Error handling answer:", err);
                }
            });

            socket.on('ice_candidate', async (candidate) => {
                if (peerRef.current && peerRef.current.remoteDescription) {
                    try {
                        await peerRef.current.addIceCandidate(candidate);
                    } catch (e) {
                        console.error("Error adding ice candidate:", e);
                    }
                } else {
                    pendingCandidates.current.push(candidate);
                }
            });

            // Initialize WebRTC
            setupWebRTC();
        } else if (user.mode === 'text') {
            // Enable WebRTC for Audio in Text Mode
            // Same handlers but we might need to be careful about not expecting video tracks?
            // Actually, the handlers are generic enough. The main diff is setupWebRTC constraints.
            // DUPLICATING LISTENERS for clarity and to allow 'text' mode access

            socket.on('offer', async (offer) => {
                console.log("TextMode: Received offer");
                if (!peerRef.current) {
                    pendingOffer.current = offer;
                    // setupWebRTC will be called below
                } else {
                    if (isNegotiating.current) return;
                    isNegotiating.current = true;
                    try {
                        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                        const answer = await peerRef.current.createAnswer();
                        await peerRef.current.setLocalDescription(answer);
                        socket.emit('answer', { roomId: matchData.roomId, answer });
                        pendingCandidates.current.forEach(c => peerRef.current?.addIceCandidate(c));
                        pendingCandidates.current = [];
                    } catch (err) { console.error(err); }
                    finally { isNegotiating.current = false; }
                }
            });

            socket.on('answer', async (answer) => {
                if (!peerRef.current) return;
                try {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    pendingCandidates.current.forEach(c => peerRef.current?.addIceCandidate(c));
                    pendingCandidates.current = [];
                } catch (err) { console.error(err); }
            });

            socket.on('ice_candidate', async (candidate) => {
                if (peerRef.current && peerRef.current.remoteDescription) {
                    try { await peerRef.current.addIceCandidate(candidate); } catch (e) { }
                } else {
                    pendingCandidates.current.push(candidate);
                }
            });

            setupWebRTC();
        }

        return () => {
            socket.off('chat_status');
            socket.off('partner_disconnected');
            socket.off('message');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice_candidate');
            // Cleanup media only if it was started
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.close();
            }
        };
    }, []);

    const isNegotiating = useRef(false);

    const setupWebRTC = async () => {
        // SKIP WebRTC setup if in Text Mode? NO, now we want Audio.
        // if (user.mode === 'text') return;

        try {
            logWithTime("Requesting access to media devices...");
            // Constraints based on mode
            const constraints = user.mode === 'text'
                ? { video: false, audio: true }
                : { video: true, audio: true };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (!localVideoRef.current) {
                logWithTime("Component unmounted, stopping stream");
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            logWithTime("Media access granted");
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            logWithTime("Creating RTCPeerConnection");
            const peer = new RTCPeerConnection(SERVERS);
            peerRef.current = peer;

            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream);
                logWithTime("Added local track:", track.kind);
            });

            peer.oniceconnectionstatechange = () => { /* ... */ };
            peer.onconnectionstatechange = () => { /* ... */ };
            peer.ontrack = (event) => {
                logWithTime("Received remote track:", event.track.kind);
                let remoteStream = event.streams[0];
                if (!remoteStream) {
                    remoteStream = new MediaStream([event.track]);
                }
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    remoteVideoRef.current.play();
                }
                // Also play in audio element if it exists (for text mode)
                // Actually if we reuse remoteVideoRef for audio in text mode (it's a video tag), it works for audio too.
                // But let's look for a dedicated audio ref if we add one, or just ensure remoteVideoRef is rendered hidden.
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', { roomId: matchData.roomId, candidate: event.candidate });
                }
            };

            if (pendingOffer.current) {
                const offer = pendingOffer.current;
                pendingOffer.current = null;

                if (isNegotiating.current) return;
                isNegotiating.current = true;
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('answer', { roomId: matchData.roomId, answer });
                    pendingCandidates.current.forEach(c => peer.addIceCandidate(c));
                    pendingCandidates.current = [];
                } catch (err) {
                    console.error(err);
                } finally {
                    isNegotiating.current = false;
                }
            }

            if (matchData.isInitiator && !pendingOffer.current) {
                if (isNegotiating.current) return;
                isNegotiating.current = true;
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('offer', { roomId: matchData.roomId, offer });
                } catch (err) {
                    console.error(err);
                } finally {
                    isNegotiating.current = false;
                }
            }

        } catch (err) {
            console.error("Error accessing media devices:", err);
            // In video mode, valid error. In text mode we shouldn't be here.
            alert("Could not access camera/microphone.");
        }
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        socket.emit('message', { roomId: matchData.roomId, message: { text: inputText } });
        setMessages(prev => [...prev, { sender: 'me', text: inputText, timestamp: Date.now() }]);
        setInputText('');
        setInputText('');
    };

    const toggleMic = () => {
        // For local stream updates
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const toggleChat = () => {
        if (user.mode === 'text') return;
        const newState = !isChatOpen;
        setIsChatOpen(newState);
        if (newState) {
            setUnreadCount(0);
        }
        socket.emit('chat_status', { roomId: matchData.roomId, isOpen: newState });
    };

    const handleReport = () => {
        setIsReportModalOpen(false);
        alert("Report submitted successfully.");
    };

    return (
        <div className="flex h-[100dvh] w-full bg-black overflow-hidden flex-col md:flex-row">
            {/* 
               Main Video Area 
               - If Video Mode: Visible, may have overlay.
               - If Text Mode: HIDDEN (width 0).
            */}
            {user.mode === 'video' ? (
                <div className={`relative bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out ${isChatOpen
                    ? 'h-[70%] w-full md:h-full md:w-[70%]'
                    : 'w-full h-full'
                    }`}>


                    {/* Remote Video (Hidden/Behind Overlay) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Controls Overlay - Rendered conditionally */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 items-center z-20">
                        {/* Chat Toggle Button */}
                        <button
                            onClick={toggleChat}
                            className={`p-3 rounded-full transition-all relative ${isChatOpen ? 'bg-white text-black' : 'bg-black/50 text-white hover:bg-black/70'}`}
                        >
                            {unreadCount > 0 && !isChatOpen && (
                                <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-gray-900 bg-red-500"></span>
                            )}
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </button>

                        {/* Mic Toggle Button */}
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                        >
                            {isMuted ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            )}
                        </button>

                        {/* Video Toggle Button */}
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                        >
                            {isVideoOff ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                        </button>

                        <button
                            onClick={onSkip}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-yellow-500/20"
                        >
                            SKIP
                        </button>

                        <button
                            onClick={onLeave}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-red-500/20"
                        >
                            STOP
                        </button>
                    </div>

                    {/* Disconnect Overlay - Rendered only in video mode */}
                    {partnerDisconnected && (
                        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-300">
                            <div className="text-4xl mb-4">👻</div>
                            <h3 className="text-2xl font-bold mb-2">Partner Disconnected</h3>
                            {!canReconnect && <p className="text-gray-400">Searching for new partner...</p>}
                        </div>
                    )}

                    {/* Local Video (PiP) */}
                    <div className="absolute top-4 right-4 w-32 md:w-56 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-1 rounded">You</div>
                    </div>
                </div>
            ) : (
                // HIDDEN VIDEO ELEMENT FOR TEXT MODE AUDIO
                <div className="hidden">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-0 h-0"
                    />
                    {/* We need a local ref to hold the stream so toggleMic works, even if not displaying video */}
                    <video ref={localVideoRef} muted autoPlay className="w-0 h-0" />
                </div>
            )}


            {/* Chat Sidebar - Expanded to Full Width in Text Mode */}
            <div className={`flex flex-col shadow-xl z-20 overflow-hidden transition-all duration-300 relative
                ${user.mode === 'text'
                    ? 'w-full h-full bg-[#0a0a0f]' // Full screen chat with base color
                    : isChatOpen
                        ? 'h-[30%] w-full md:h-full md:w-[30%] bg-white border-l border-gray-200'
                        : 'w-0 hidden'
                }`}>

                {/* Text Mode Ambient Background */}
                {user.mode === 'text' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
                    </div>
                )}

                {/* Chat Header */}
                <div className={`p-4 border-b flex justify-between items-center text-white z-10 backdrop-blur-md transition-all duration-300
                    ${user.mode === 'text' ? 'bg-[#16161d]/40 border-white/5' : 'bg-[#16161d] border-white/5'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${user.mode === 'text' ? 'bg-green-500' : 'bg-green-500'} animate-pulse`}></div>
                        <div>
                            <h3 className="font-bold">
                                {user.mode === 'text' ? 'Text Chat' : 'Chat'}
                            </h3>
                            <span className="text-xs text-gray-400">
                                Connection with {matchData.partner.name || 'Stranger'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Audio Toggle for Text Mode */}
                        {user.mode === 'text' && (
                            <button
                                onClick={toggleMic}
                                className={`p-2 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/20 text-indigo-400'}`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onSkip}
                            className="text-yellow-500 hover:text-yellow-400 px-3 py-1 bg-yellow-500/10 rounded-lg text-xs font-bold transition-colors"
                        >
                            SKIP
                        </button>
                        <button
                            onClick={onLeave}
                            className="text-red-500 hover:text-red-400 px-3 py-1 bg-red-500/10 rounded-lg text-xs font-bold transition-colors"
                        >
                            STOP
                        </button>
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto p-4 space-y-3 z-10 transition-colors duration-300 ${user.mode === 'text' ? 'bg-transparent' : 'bg-[#0a0a0f]'}`}>
                    {/* Messages */}
                    {!partnerChatOpen && user.mode !== 'text' && (
                        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                            <span>Partner has chat closed.</span>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.sender === 'me'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : msg.sender === 'system'
                                    ? 'bg-gray-800 text-gray-400 italic text-xs text-center w-full py-1 border border-white/5'
                                    : 'bg-[#1f1f28] text-gray-200 border border-white/5 rounded-bl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className={`p-4 border-t border-white/5 z-10 backdrop-blur-md transition-all duration-300 ${user.mode === 'text' ? 'bg-[#16161d]/40' : 'bg-[#16161d]'}`}>
                    <div className="relative">
                        <input
                            className={`w-full border border-white/10 rounded-full px-5 py-3 pr-12 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white placeholder-gray-500 transition-all text-sm
                                ${user.mode === 'text' ? 'bg-[#0a0a0f]/50' : 'bg-[#0a0a0f]'}`}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={partnerDisconnected ? "Partner disconnected..." : "Type a message..."}
                            disabled={partnerDisconnected}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={partnerDisconnected || !inputText}
                            className="absolute right-2 top-1.5 bg-indigo-600 text-white p-1.5 rounded-full disabled:opacity-50 hover:bg-indigo-700 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </form>
            </div>

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReport}
                userName={matchData.partner.name || 'Anonymous'}
            />

            {/* Partner Disconnected Modal */}
            {partnerDisconnected && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#16161d] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
                        {/* Background Splashes */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <span className="text-3xl">👻</span>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Partner Disconnected</h2>
                            <p className="text-gray-400 mb-8">
                                The other person has left the chat.<br />
                                What would you like to do next?
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onSkip}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-600/20 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    Search for Others
                                </button>

                                <button
                                    onClick={onLeave}
                                    className="w-full py-3.5 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 font-medium rounded-xl transition-all border border-white/5 hover:border-white/10 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
