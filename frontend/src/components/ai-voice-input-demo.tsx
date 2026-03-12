"use client"

import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { useState } from "react";

export function AIVoiceInputDemo() {
    const [transcripts, setTranscripts] = useState<{ text: string; timestamp: Date }[]>([]);
    const [currentText, setCurrentText] = useState("");

    const handleTranscript = (text: string) => {
        setTranscripts(prev => [...prev.slice(-4), { text, timestamp: new Date() }]);
        setCurrentText("");
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <AIVoiceInput
                    onStart={() => console.log('Recording started')}
                    onStop={(duration) => console.log('Recording stopped:', duration, 'seconds')}
                    onTranscript={handleTranscript}
                    onInterimTranscript={(text) => setCurrentText(text)}
                    language="auto"
                />
            </div>

            {/* Показываем промежуточный текст */}
            {currentText && (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center">
                    <p className="text-sm text-muted-foreground italic">{currentText}</p>
                </div>
            )}

            {/* Показываем распознанные фразы */}
            {transcripts.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground text-center">
                        Распознанный текст:
                    </h3>
                    <div className="space-y-1.5 max-w-md mx-auto">
                        {transcripts.map((item, i) => (
                            <div
                                key={i}
                                className="rounded-lg bg-muted/50 px-4 py-2.5 text-sm flex items-start gap-2"
                            >
                                <span className="text-muted-foreground/60 text-xs mt-0.5 shrink-0">
                                    {item.timestamp.toLocaleTimeString()}
                                </span>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
