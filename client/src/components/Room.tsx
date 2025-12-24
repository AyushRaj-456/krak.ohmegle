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
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [partnerDisconnected, setPartnerDisconnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // WebRTC Refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const pendingCandidates = useRef<RTCIceCandidate[]>([]);

    const pendingOffer = useRef<any>(null);

    useEffect(() => {
        // Handle Disconnect
        socket.on('partner_disconnected', () => {
            setPartnerDisconnected(true);
            setMessages(prev => [...prev, { sender: 'system', text: 'Partner disconnected.', timestamp: Date.now() }]);
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
        });

        socket.on('message', (msg: { text: string }) => {
            setMessages(prev => [...prev, { sender: 'partner', text: msg.text, timestamp: Date.now() }]);
        });

        // WebRTC Signaling Listeners (Moved here to catch events while getUserMedia is pending)
        socket.on('offer', async (offer) => {
            console.log("Received offer");
            if (!peerRef.current) {
                console.log("Peer not ready, queueing offer");
                pendingOffer.current = offer;
                return;
            }
            try {
                // If we are getting an offer, we are the answerer.
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerRef.current.createAnswer();
                await peerRef.current.setLocalDescription(answer);
                socket.emit('answer', { roomId: matchData.roomId, answer });

                // Process any pending candidates that arrived before the offer
                pendingCandidates.current.forEach(c => peerRef.current?.addIceCandidate(c));
                pendingCandidates.current = [];
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        });

        socket.on('answer', async (answer) => {
            console.log("Received answer");
            if (!peerRef.current) return;
            try {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                // Add pending candidates
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

        return () => {
            socket.off('partner_disconnected');
            socket.off('message');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice_candidate');
            // Cleanup media tracks
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.close();
            }
        };
    }, []);

    const setupWebRTC = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const peer = new RTCPeerConnection(SERVERS);
            peerRef.current = peer;

            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            peer.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', { roomId: matchData.roomId, candidate: event.candidate });
                }
            };

            // Handle queued offer if exists
            if (pendingOffer.current) {
                console.log("Processing queued offer");
                const offer = pendingOffer.current;
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('answer', { roomId: matchData.roomId, answer });
                pendingOffer.current = null;

                // Process pending candidates
                pendingCandidates.current.forEach(c => peer.addIceCandidate(c));
                pendingCandidates.current = [];
            }

            // Initiator Logic
            if (matchData.isInitiator && !pendingOffer.current) {
                console.log("I am initiator, creating offer");
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('offer', { roomId: matchData.roomId, offer });
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

    return (
        <div className="flex h-screen w-full bg-black overflow-hidden flex-col md:flex-row">
            {/* Main Video Area */}
            <div className="flex-1 relative bg-gray-900">
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
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
            <div className="h-64 md:h-full md:w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Chat</h3>
                    <div className="text-xs text-gray-400">
                        {matchData.partner.gender === 'Female' ? '♀️' : matchData.partner.gender === 'Male' ? '♂️' : '👤'}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
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
        </div>
    );
};
