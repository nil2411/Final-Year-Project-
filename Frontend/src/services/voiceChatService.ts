/**
 * Voice Chat Service
 * Handles voice input and sends to backend for transcription + response
 */
import { sendVoiceMessage, type VoiceChatResponse } from './api';

export interface VoiceChatOptions {
  language: 'hi' | 'mr' | 'en';
  conversationId?: string;
  useRag?: boolean;
}

export type { VoiceChatOptions };

/**
 * Process voice input using backend STT + Chat
 */
export async function processVoiceInput(
  audioFile: File,
  options: VoiceChatOptions
): Promise<VoiceChatResponse> {
  try {
    const response = await sendVoiceMessage(
      audioFile,
      options.language,
      options.conversationId,
      options.useRag ?? true
    );

    return response;
  } catch (error) {
    console.error('Voice chat error:', error);
    throw error;
  }
}

/**
 * Convert MediaRecorder audio blob to File
 */
export function audioBlobToFile(blob: Blob, filename: string = 'audio.wav'): File {
  return new File([blob], filename, { type: blob.type || 'audio/wav' });
}

/**
 * Record audio from microphone
 */
export async function recordAudio(
  duration: number = 5000,
  onDataAvailable?: (blob: Blob) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            onDataAvailable?.(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          stream.getTracks().forEach((track) => track.stop());
          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          stream.getTracks().forEach((track) => track.stop());
          reject(error);
        };

        mediaRecorder.start();

        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, duration);
      })
      .catch(reject);
  });
}

