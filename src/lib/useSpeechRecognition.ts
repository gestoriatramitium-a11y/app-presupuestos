import { useState, useRef, useCallback } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  lang = "es-ES",
  onResult,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error !== "aborted") {
        onError?.(`Error de reconocimiento: ${event.error}`);
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}
