import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type MessageRole = 'user' | 'bot' | 'system';

export interface ActionButton {
    text: string;
    data: string;
}

export interface ChatMessage {
    id: string;
    content: string;
    sender: MessageRole;
    timestamp?: string;
    buttons?: ActionButton[][];
}

export function useSocket(serverUrl: string = 'http://localhost:3000') {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        const socketInstance = io(serverUrl);
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to socket server');
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from socket server');
        });

        socketInstance.on('bot_message', (msg: any) => {
            setMessages((prev) => {
                // Предотвращение дублей (если сервер случайно пришлет тоже самое id)
                if (prev.find(m => m.id === msg.id)) return prev;
                return [
                    ...prev,
                    {
                        id: msg.id || Date.now().toString(),
                        content: msg.text || '',
                        sender: msg.role === 'bot' ? 'bot' : 'system',
                        timestamp: msg.timestamp,
                        buttons: msg.buttons,
                    },
                ];
            });
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [serverUrl]);

    const sendMessage = useCallback((content: string) => {
        if (!socket || !isConnected) return false;

        // Оптимистичное добавление в интерфейс
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, userMsg]);

        // Отправка на бэкенд
        socket.emit('client_message', { text: content });
        return true;
    }, [socket, isConnected]);

    const sendButtonClick = useCallback((data: string) => {
        if (!socket || !isConnected) return false;
        socket.emit('button_click', { data });
        return true;
    }, [socket, isConnected]);

    return {
        isConnected,
        messages,
        sendMessage,
        sendButtonClick
    };
}
