"use client";

import { Mic, MicOff, Square } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "@/lib/speech-recognition.d";

interface AIVoiceInputProps {
    onStart?: () => void;
    onStop?: (duration: number) => void;
    onTranscript?: (text: string) => void;
    onInterimTranscript?: (text: string) => void;
    language?: string;
    visualizerBars?: number;
    demoMode?: boolean;
    demoInterval?: number;
    className?: string;
}

export function AIVoiceInput({
    onStart,
    onStop,
    onTranscript,
    onInterimTranscript,
    language = "auto",
    visualizerBars = 48,
    demoMode = false,
    demoInterval = 3000,
    className
}: AIVoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [interimText, setInterimText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [audioLevels, setAudioLevels] = useState<number[]>(
        new Array(visualizerBars).fill(4)
    );

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        setIsClient(true);
        // Проверяем поддержку Web Speech API
        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setIsSupported(false);
        }
    }, []);

    // Получаем BCP-47 lang код из параметра language
    const getLangCode = useCallback((lang: string): string => {
        const langMap: Record<string, string> = {
            auto: "",
            ru: "ru-RU",
            lv: "lv-LV",
            en: "en-US",
            de: "de-DE",
            lt: "lt-LT",
            et: "et-EE",
        };
        return langMap[lang] || lang;
    }, []);

    // Визуализация аудио уровней через analyser
    const startAudioVisualization = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevels = () => {
                analyser.getByteFrequencyData(dataArray);
                const step = Math.floor(dataArray.length / visualizerBars);
                const levels = [];
                for (let i = 0; i < visualizerBars; i++) {
                    const value = dataArray[i * step] || 0;
                    // Нормализуем от 4px до 100% высоты
                    levels.push(Math.max(4, (value / 255) * 100));
                }
                setAudioLevels(levels);
                animationFrameRef.current = requestAnimationFrame(updateLevels);
            };

            updateLevels();
        } catch {
            // Если микрофон недоступен, используем рандомную анимацию
            const fakeVisualize = () => {
                const levels = [];
                for (let i = 0; i < visualizerBars; i++) {
                    levels.push(4 + Math.random() * 80);
                }
                setAudioLevels(levels);
                animationFrameRef.current = requestAnimationFrame(fakeVisualize);
            };
            fakeVisualize();
        }
    }, [visualizerBars]);

    const stopAudioVisualization = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setAudioLevels(new Array(visualizerBars).fill(4));
    }, [visualizerBars]);

    const startListening = useCallback(() => {
        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setErrorMessage("Браузер не поддерживает распознавание речи");
            return;
        }

        setErrorMessage("");

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;

        const langCode = getLangCode(language);
        if (langCode) {
            recognition.lang = langCode;
        }

        recognition.onstart = () => {
            setIsListening(true);
            onStart?.();
            startAudioVisualization();
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

            if (interimTranscript) {
                setInterimText(interimTranscript);
                onInterimTranscript?.(interimTranscript);
            }

            if (finalTranscript) {
                setInterimText("");
                onTranscript?.(finalTranscript.trim());
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
                setErrorMessage("Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.");
            } else if (event.error === "no-speech") {
                setErrorMessage("Речь не обнаружена. Попробуйте ещё раз.");
            } else if (event.error === "network") {
                setErrorMessage("Ошибка сети. Проверьте подключение.");
            } else {
                setErrorMessage(`Ошибка: ${event.error}`);
            }
            setIsListening(false);
            stopAudioVisualization();
        };

        recognition.onend = () => {
            setIsListening(false);
            stopAudioVisualization();
            onStop?.(time);
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            console.error("Failed to start recognition:", err);
            setErrorMessage("Не удалось запустить распознавание речи");
        }
    }, [language, getLangCode, onStart, onStop, onTranscript, onInterimTranscript, time, startAudioVisualization, stopAudioVisualization]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        stopAudioVisualization();
        setIsListening(false);
        setInterimText("");
    }, [stopAudioVisualization]);

    // Таймер записи
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isListening) {
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [isListening]);

    // Демо-режим
    useEffect(() => {
        if (!demoMode || !isClient) return;

        let timeoutId: NodeJS.Timeout;
        const runAnimation = () => {
            setIsListening(true);
            startAudioVisualization();
            timeoutId = setTimeout(() => {
                setIsListening(false);
                stopAudioVisualization();
                timeoutId = setTimeout(runAnimation, 1000);
            }, demoInterval);
        };

        const initialTimeout = setTimeout(runAnimation, 100);
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(initialTimeout);
            stopAudioVisualization();
        };
    }, [demoMode, demoInterval, isClient, startAudioVisualization, stopAudioVisualization]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            stopAudioVisualization();
        };
    }, [stopAudioVisualization]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleClick = () => {
        if (demoMode) return;

        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (!isClient) return null;

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
                {/* Кнопка микрофона */}
                <button
                    className={cn(
                        "group w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300",
                        !isSupported && "opacity-50 cursor-not-allowed",
                        isListening
                            ? "bg-red-500/10 hover:bg-red-500/20 ring-2 ring-red-500/50 animate-pulse"
                            : "bg-none hover:bg-black/10 dark:hover:bg-white/10"
                    )}
                    type="button"
                    onClick={handleClick}
                    disabled={!isSupported}
                    title={
                        !isSupported
                            ? "Браузер не поддерживает распознавание речи"
                            : isListening
                                ? "Нажмите, чтобы остановить"
                                : "Нажмите, чтобы говорить"
                    }
                >
                    {isListening ? (
                        <Square className="w-6 h-6 text-red-500 fill-red-500" />
                    ) : isSupported ? (
                        <Mic className="w-6 h-6 text-black/70 dark:text-white/70" />
                    ) : (
                        <MicOff className="w-6 h-6 text-black/30 dark:text-white/30" />
                    )}
                </button>

                {/* Таймер */}
                <span
                    className={cn(
                        "font-mono text-sm transition-opacity duration-300",
                        isListening
                            ? "text-red-500 dark:text-red-400"
                            : "text-black/30 dark:text-white/30"
                    )}
                >
                    {formatTime(time)}
                </span>

                {/* Визуализатор аудио */}
                <div className="h-8 w-64 flex items-center justify-center gap-0.5">
                    {audioLevels.map((level, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-0.5 rounded-full transition-all",
                                isListening
                                    ? "bg-red-500/60 dark:bg-red-400/60 duration-75"
                                    : "bg-black/10 dark:bg-white/10 duration-300"
                            )}
                            style={{
                                height: isListening ? `${level}%` : "4px",
                            }}
                        />
                    ))}
                </div>

                {/* Промежуточный текст */}
                {interimText && (
                    <p className="text-sm text-black/60 dark:text-white/60 italic text-center px-4 max-w-md truncate">
                        {interimText}
                    </p>
                )}

                {/* Ошибка */}
                {errorMessage && (
                    <p className="text-xs text-red-500 text-center px-4 max-w-md">
                        {errorMessage}
                    </p>
                )}

                {/* Статус */}
                <p className="h-4 text-xs text-black/70 dark:text-white/70">
                    {!isSupported
                        ? "Распознавание речи не поддерживается"
                        : isListening
                            ? "🔴 Слушаю... Говорите!"
                            : "🎤 Нажмите для голосового ввода"}
                </p>
            </div>
        </div>
    );
}
