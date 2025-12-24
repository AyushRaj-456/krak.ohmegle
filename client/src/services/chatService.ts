import {
    collection,
    addDoc,
    query,
    getDocs,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Message } from '../types';

// Save a single message to Firestore
export const saveChatMessage = async (
    roomId: string,
    senderId: string,
    text: string
) => {
    try {
        const messagesRef = collection(db, 'chats', roomId, 'messages');
        await addDoc(messagesRef, {
            sender: senderId,
            text,
            timestamp: serverTimestamp(),
        });
        return { error: null };
    } catch (error: any) {
        console.error('Error saving message:', error);
        return { error: error.message };
    }
};

// Get chat history for a room
export const getChatHistory = async (roomId: string) => {
    try {
        const messagesRef = collection(db, 'chats', roomId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                sender: data.sender === 'system' ? 'system' : data.sender,
                text: data.text,
                timestamp: data.timestamp?.toMillis() || Date.now(),
            });
        });

        return { messages, error: null };
    } catch (error: any) {
        console.error('Error getting chat history:', error);
        return { messages: [], error: error.message };
    }
};

// Save complete chat session
export const saveChatSession = async (
    roomId: string,
    participants: string[],
    messages: Message[]
) => {
    try {
        const chatRef = doc(db, 'chats', roomId);
        await setDoc(chatRef, {
            participants,
            createdAt: serverTimestamp(),
            messageCount: messages.length,
        });

        // Save all messages
        for (const msg of messages) {
            if (msg.sender !== 'system') {
                await saveChatMessage(roomId, msg.sender, msg.text);
            }
        }

        return { error: null };
    } catch (error: any) {
        console.error('Error saving chat session:', error);
        return { error: error.message };
    }
};
