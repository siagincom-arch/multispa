"use client"

import { useState, useRef, useCallback, FormEvent } from "react"
import { useSocket, ChatMessage } from "@/components/hooks/useSocket"
import { Send, Bot, Paperclip, Mic, MicOff, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    ChatBubble,
    ChatBubbleAvatar,
    ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "@/lib/speech-recognition.d"

export function ExpandableChatDemo() {
    const { isConnected, messages, sendMessage, sendButtonClick } = useSocket("http://localhost:3000");
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        sendMessage(input);
        setInput("")
    }

    const handleAttachFile = () => {
        //
    }

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const handleMicrophoneClick = useCallback(() => {
        // Если уже записываем — останавливаем
        if (isRecording) {
            stopRecording();
            return;
        }

        const SpeechRecognitionAPI =
            typeof window !== "undefined"
                ? window.SpeechRecognition || window.webkitSpeechRecognition
                : null;

        if (!SpeechRecognitionAPI) {
            alert("Ваш браузер не поддерживает распознавание речи. Используйте Chrome или Edge.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                setInput(prev => {
                    const separator = prev.trim() ? " " : "";
                    return prev.trim() + separator + finalTranscript.trim();
                });
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            console.error("Failed to start recognition:", err);
        }
    }, [isRecording, stopRecording]);

    return (
        <div className="h-[600px] relative">
            <ExpandableChat
                size="lg"
                position="bottom-right"
                icon={<Bot className="h-6 w-6" />}
            >
                <ExpandableChatHeader className="flex-col text-center justify-center">
                    <h1 className="text-xl font-semibold">Chat with AI ✨</h1>
                    <p className="text-sm text-muted-foreground">
                        Ask me anything about the components
                    </p>
                </ExpandableChatHeader>

                <ExpandableChatBody>
                    <ChatMessageList>
                        {messages.map((message) => (
                            <ChatBubble
                                key={message.id}
                                variant={message.sender === "user" ? "sent" : "received"}
                            >
                                <ChatBubbleAvatar
                                    className="h-8 w-8 shrink-0"
                                    src={
                                        message.sender === "user"
                                            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                                            : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                                    }
                                    fallback={message.sender === "user" ? "US" : "AI"}
                                />
                                <ChatBubbleMessage
                                    variant={message.sender === "user" ? "sent" : "received"}
                                >
                                    {message.content}
                                    {message.buttons && message.buttons.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-3">
                                            {message.buttons.map((row, i) => (
                                                <div key={i} className="flex gap-2 flex-wrap">
                                                    {row.map((btn, j) => (
                                                        <Button
                                                            key={j}
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => sendButtonClick(btn.data)}
                                                        >
                                                            {btn.text}
                                                        </Button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ChatBubbleMessage>
                            </ChatBubble>
                        ))}


                        {isLoading && (
                            <ChatBubble variant="received">
                                <ChatBubbleAvatar
                                    className="h-8 w-8 shrink-0"
                                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                                    fallback="AI"
                                />
                                <ChatBubbleMessage isLoading />
                            </ChatBubble>
                        )}
                    </ChatMessageList>
                </ExpandableChatBody>

                <ExpandableChatFooter>
                    <form
                        onSubmit={handleSubmit}
                        className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
                    >
                        <ChatInput
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isRecording ? "🔴 Говорите..." : "Введите сообщение..."}
                            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
                        />
                        <div className="flex items-center p-3 pt-0 justify-between">
                            <div className="flex">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={handleAttachFile}
                                >
                                    <Paperclip className="size-4" />
                                </Button>

                                <Button
                                    variant={isRecording ? "destructive" : "ghost"}
                                    size="icon"
                                    type="button"
                                    onClick={handleMicrophoneClick}
                                    title={isRecording ? "Остановить запись" : "Голосовой ввод"}
                                    className={isRecording ? "animate-pulse" : ""}
                                >
                                    {isRecording ? (
                                        <MicOff className="size-4" />
                                    ) : (
                                        <Mic className="size-4" />
                                    )}
                                </Button>
                            </div>
                            <Button type="submit" size="sm" className="ml-auto gap-1.5">
                                Отправить
                                <CornerDownLeft className="size-3.5" />
                            </Button>
                        </div>
                    </form>
                </ExpandableChatFooter>
            </ExpandableChat>
        </div>
    )
}
