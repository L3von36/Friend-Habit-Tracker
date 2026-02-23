import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseSpeechRecognitionProps {
    onResult: (transcript: string) => void;
    onError?: (error: string) => void;
}

export function useSpeechRecognition({ onResult, onError }: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error !== 'no-speech') {
                    if (onError) {
                        onError(event.error);
                    } else {
                        toast.error(`Voice error: ${event.error}`);
                    }
                }
            };
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            recognitionRef.current = recognition;
        }
    }, [onResult, onError]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if (!recognitionRef.current) {
                toast.error("Speech recognition is not supported in this browser.");
                return;
            }
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error('Failed to start recognition', e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
        }
    }, [isListening]);

    return {
        isListening,
        toggleListening,
        stopListening
    };
}
