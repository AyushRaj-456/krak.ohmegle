import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { MatchData, Message, User } from '../types';

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
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const CallTimer = () => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white font-mono flex items-center gap-2 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            {formatTime(seconds)}
        </div>
    );
};

export const Room: React.FC<RoomProps> = ({ socket, matchData, onLeave, onSkip }) => {
    // Chat Toggle State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [partnerChatOpen, setPartnerChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Existing State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [partnerDisconnected, setPartnerDisconnected] = useState(false);
    const [canReconnect, setCanReconnect] = useState(false); // Delay state
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // WebRTC Refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const pendingCandidates = useRef<RTCIceCandidate[]>([]);
    const pendingOffer = useRef<any>(null);

    // Ref for current chat state to use inside socket callbacks
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

        // Emit initial status (closed)
        socket.emit('chat_status', { roomId: matchData.roomId, isOpen: false });

        // Handle Disconnect
        socket.on('partner_disconnected', () => {
            // ... existing disconnect logic ...
            setPartnerDisconnected(true);
            setMessages(prev => [...prev, { sender: 'system', text: 'Partner disconnected.', timestamp: Date.now() }]);
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }

            // Reconnect delay
            setCanReconnect(false);
            setTimeout(() => {
                setCanReconnect(true);
            }, 2000);
        });

        // ... existing listeners ...
        socket.on('message', (msg: { text: string }) => {
            setMessages(prev => [...prev, { sender: 'partner', text: msg.text, timestamp: Date.now() }]);
            if (!isChatOpenRef.current) {
                setUnreadCount(prev => prev + 1);
            }
        });

        socket.on('offer', async (offer) => {
            console.log("Received offer");
            if (!peerRef.current) {
                console.log("Peer not ready, queueing offer");
                pendingOffer.current = offer;
                return;
            }

            // Lock: If we are already negotiating, ignore or queue? 
            // In restart scenario, we might need to queue. 
            // For now, prevent parallel execution causing InvalidStateError
            if (isNegotiating.current) {
                console.warn("Already negotiating, ignoring concurrent offer");
                return;
            }
            isNegotiating.current = true;

            try {
                // If we have an existing stable connection, this is a renegotiation (not implemented fully, but basic logic holds)
                if (peerRef.current.signalingState !== 'stable' && peerRef.current.signalingState !== 'have-local-offer') {
                    // This prevents 'slowness' or errors if glare happens
                    // But in simple omegle-clone, rollback isn't implemented.
                    // Just proceeding.
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
            // ... existing answer logic ...
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
            // ... existing ice candidate logic ...
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

        return () => {
            socket.off('chat_status'); // Clean up listener
            socket.off('partner_disconnected');
            socket.off('message');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice_candidate');
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.close();
            }
        };
    }, []);

    const isNegotiating = useRef(false);

    // ... setupWebRTC ...
    const setupWebRTC = async () => {
        try {
            console.log("Requesting access to media devices...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            if (!localVideoRef.current) {
                console.log("Component unmounted, stopping stream");
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            console.log("Media access granted");
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            console.log("Creating RTCPeerConnection");
            const peer = new RTCPeerConnection(SERVERS);
            peerRef.current = peer;

            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream);
                console.log("Added local track:", track.kind);
            });

            // ICE Connection State Logging
            peer.oniceconnectionstatechange = () => {
                console.log("ICE Connection State Change:", peer.iceConnectionState);
                if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'failed') {
                    console.log("ICE connection failed/disconnected. Debug info:", {
                        signalingState: peer.signalingState,
                        iceConnectionState: peer.iceConnectionState,
                        connectionState: peer.connectionState
                    });
                }
                if (peer.iceConnectionState === 'connected') {
                    console.log("ICE Connection ESTABLISHED! Media should flow.");
                }
            };

            peer.onconnectionstatechange = () => {
                console.log("Peer Connection State Change:", peer.connectionState);
            };

            peer.ontrack = (event) => {
                console.log("Received remote track:", event.track.kind, event.streams[0]?.id);

                let remoteStream = event.streams[0];

                if (!remoteStream) {
                    console.log("No stream in event, creating/using fallback stream");
                    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                        remoteStream = remoteVideoRef.current.srcObject as MediaStream;
                        remoteStream.addTrack(event.track);
                    } else {
                        remoteStream = new MediaStream([event.track]);
                    }
                }

                if (remoteVideoRef.current) {
                    // Ensure source is set
                    if (remoteVideoRef.current.srcObject !== remoteStream) {
                        console.log("Setting remote stream srcObject (Track kind: " + event.track.kind + ")");
                        remoteVideoRef.current.srcObject = remoteStream;
                    }

                    remoteVideoRef.current.muted = false;
                    remoteVideoRef.current.volume = 1.0;

                    const playPromise = remoteVideoRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log("Remote video playing successfully");
                        }).catch(error => {
                            console.error("Remote video play failed:", error);
                            // Auto-retry or UI prompt?
                        });
                    }
                }
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    // console.log("Sending ICE candidate"); // Verbose
                    socket.emit('ice_candidate', { roomId: matchData.roomId, candidate: event.candidate });
                }
            };

            // Handle Queued Offer
            if (pendingOffer.current) {
                console.log("Processing queued offer");
                const offer = pendingOffer.current;
                pendingOffer.current = null; // Clear immediately to prevent double processing

                if (isNegotiating.current) return;
                isNegotiating.current = true;

                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit('answer', { roomId: matchData.roomId, answer });

                    // Process pending candidates now that remote desc is set
                    pendingCandidates.current.forEach(c => peer.addIceCandidate(c));
                    pendingCandidates.current = [];
                } catch (err) {
                    console.error("Error processing queued offer:", err);
                } finally {
                    isNegotiating.current = false;
                }
            }

            // Create Offer if Initiator
            if (matchData.isInitiator && !pendingOffer.current) {
                console.log("I am initiator, creating offer");
                if (isNegotiating.current) return;
                isNegotiating.current = true;

                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('offer', { roomId: matchData.roomId, offer });
                } catch (err) {
                    console.error("Error creating offer:", err);
                } finally {
                    isNegotiating.current = false;
                }
            }

        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Could not access camera/microphone.");
        }
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        socket.emit('message', { roomId: matchData.roomId, message: { text: inputText } });
        setMessages(prev => [...prev, { sender: 'me', text: inputText, timestamp: Date.now() }]);
        setInputText('');
    };

    const toggleMic = () => {
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
        const newState = !isChatOpen;
        setIsChatOpen(newState);
        if (newState) {
            setUnreadCount(0); // Reset unread count when opening chat
        }
        socket.emit('chat_status', { roomId: matchData.roomId, isOpen: newState });
    };

    return (
        <div className="flex h-[100dvh] w-full bg-black overflow-hidden flex-col md:flex-row">
            {/* Main Video Area - Full width if chat closed, else Flex 7 */}
            <div className={`relative bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out ${isChatOpen
                ? 'h-[70%] w-full md:h-full md:w-[70%]'
                : 'w-full h-full'
                }`}>
                {/* Remote Video */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Status/Partner Info Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-3">
                    <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold">{matchData.partner.name || 'Anonymous'}</span>
                        <span className="text-sm opacity-75">({matchData.partner.branch})</span>
                    </div>
                    <CallTimer />
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 items-center z-20">
                    {/* Chat Toggle Button */}
                    <button
                        onClick={toggleChat}
                        className={`${isChatOpen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'} text-white p-4 rounded-full font-bold shadow-lg transform hover:scale-110 transition-all duration-200 flex items-center justify-center relative`}
                        title={isChatOpen ? "Close Chat" : "Open Chat"}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>

                        {/* Unread Badge */}
                        {!isChatOpen && unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </button>

                    <button
                        onClick={toggleMic}
                        className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white p-4 rounded-full font-bold shadow-lg transform hover:scale-110 transition-all duration-200 flex items-center justify-center`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        )}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white p-4 rounded-full font-bold shadow-lg transform hover:scale-110 transition-all duration-200 flex items-center justify-center`}
                        title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                        {isVideoOff ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                    </button>
                    <button
                        onClick={onSkip}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 md:px-8 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        <span className="hidden md:inline">Skip</span>
                    </button>
                    <button
                        onClick={onLeave}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 md:px-8 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        <span className="hidden md:inline">Stop</span>
                    </button>
                </div>

                {/* Disconnect Overlay */}
                {partnerDisconnected && (
                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-300">
                        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-700">
                            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Partner Disconnected</h2>
                            <p className="text-gray-400 mb-8">Your partner has left the chat. Would you like to find someone else?</p>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={onSkip}
                                    disabled={!canReconnect}
                                    className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 ${!canReconnect ? 'opacity-50 blur-[2px] cursor-not-allowed' : ''}`}
                                >
                                    {!canReconnect ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    )}
                                    {canReconnect ? 'Find New Partner' : 'Wait...'}
                                </button>
                                <button
                                    onClick={onLeave}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl transition-all hover:bg-gray-600"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local Video (PiP) */}
                <div className="absolute top-4 right-4 w-32 md:w-56 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover" // Ensure this class is correct for mirroring if needed
                    />
                    <div className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-1 rounded">You</div>
                </div>
            </div>

            {/* Chat Sidebar */}
            {isChatOpen && (
                <div className="bg-white h-[30%] w-full md:h-full md:w-[30%] border-l border-gray-200 flex flex-col shadow-xl z-20 overflow-hidden animate-in slide-in-from-right duration-300">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Chat</h3>
                        <div className="text-xs text-gray-400">
                            {matchData.partner.gender === 'Female' ? '♀️' : matchData.partner.gender === 'Male' ? '♂️' : '👤'}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {/* Partner Chat Closed Warning */}
                        {!partnerChatOpen && (
                            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span>Partner has chat closed. They may not see your messages.</span>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.sender === 'me'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : msg.sender === 'system'
                                        ? 'bg-gray-200 text-gray-500 italic text-xs text-center w-full py-1'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 bg-white border-t">
                        <div className="relative">
                            <input
                                className="w-full bg-gray-100 border-0 rounded-full px-5 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={partnerDisconnected ? "Partner disconnected..." : "Type a message..."}
                                disabled={partnerDisconnected}
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
            )}
        </div>
    );
};
