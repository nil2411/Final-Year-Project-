import { useState, useEffect, useCallback, useRef } from 'react';
import { processVoiceInput, recordAudio, audioBlobToFile } from '@/services/voiceChatService';
import type { VoiceChatOptions } from '@/services/voiceChatService';

interface VoiceRecognitionOptions {
  onResult: (text: string) => void;
  onError?: (error: Error) => void;
  lang?: string;
  useBackendSTT?: boolean; // Use backend Whisper instead of browser SpeechRecognition
  conversationId?: string;
}

export const useVoiceRecognition = ({
  onResult,
  onError,
  lang = 'hi-IN', // Default to Hindi (India)
  useBackendSTT = false, // Use backend Whisper for better accuracy
  conversationId,
}: VoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setHasRecognitionSupport(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = lang;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        onResult(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        onError?.(new Error(`Speech recognition error: ${event.error}`));
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          // Restart recognition if still listening
          recognitionInstance.start();
        }
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser');
      onError?.(new Error('Speech recognition not supported in this browser'));
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [lang, onResult, onError]);

  const startListening = useCallback(async () => {
    if (useBackendSTT) {
      // Use backend Whisper STT
      try {
        setIsRecording(true);
        setIsListening(true);
        
        // Record audio for 5 seconds (or until stopped)
        const audioBlob = await recordAudio(5000);
        const audioFile = audioBlobToFile(audioBlob, 'voice-input.wav');
        
        // Map lang code to backend language
        const langMap: Record<string, 'hi' | 'mr' | 'en'> = {
          'hi-IN': 'hi',
          'mr-IN': 'mr',
          'en-US': 'en',
          'en-GB': 'en',
        };
        const backendLang = langMap[lang] || 'hi';
        
        // Send to backend for transcription + response
        const response = await processVoiceInput(audioFile, {
          language: backendLang,
          conversationId,
          useRag: true,
        });
        
        // Call onResult with transcribed text
        onResult(response.transcribed_text);
        setIsListening(false);
        setIsRecording(false);
      } catch (error) {
        console.error('Backend voice recognition error:', error);
        onError?.(error as Error);
        setIsListening(false);
        setIsRecording(false);
      }
    } else {
      // Use browser SpeechRecognition
      if (recognition && !isListening) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (error) {
          console.error('Error starting voice recognition:', error);
          onError?.(error as Error);
        }
      }
    }
  }, [recognition, isListening, onError, useBackendSTT, lang, conversationId, onResult]);

  const stopListening = useCallback(() => {
    if (useBackendSTT) {
      // Stop recording if using backend
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsListening(false);
      }
    } else {
      // Stop browser recognition
      if (recognition && isListening) {
        recognition.stop();
        setIsListening(false);
      }
    }
  }, [recognition, isListening, useBackendSTT, isRecording]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    startListening,
    stopListening,
    toggleListening,
    hasRecognitionSupport,
  };
};

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
