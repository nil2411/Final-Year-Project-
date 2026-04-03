/**
 * API Service for KrishiBot Backend
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ChatRequest {
  query: string;
  language: 'hi' | 'mr' | 'en';
  use_rag?: boolean;
  conversation_id?: string;
  temperature?: number;
  image?: File;
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface InputRate {
  name: string;
  value: string;
  notes: string;
}

export interface Source {
  title: string;
  page: string;
  score: number;
}

export interface ChatResponse {
  title: string;
  confidence: number;
  summary_short: string;
  summary_detailed: string;
  timing: string;
  inputs_and_rates: InputRate[];
  steps_brief: string[];
  steps_detailed: string[];
  monitoring_and_signs: string[];
  urgent_action: string[];
  recommendation: string;
  regional_adaptations: string;
  follow_up_questions: string[];
  tts_text: string;
  audio_url: string;
  sources: Source[];
  notes_for_farmer: string;
  language: string;
  conversation_id?: string;
  // Backward compatibility fields (for migration)
  summary?: string;
  steps?: string[];
  follow_up?: string[];
  answer?: string;
  details?: string;
}

export interface VoiceChatResponse extends ChatResponse {
  transcribed_text: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
}

export interface LanguagesResponse {
  languages: LanguageInfo[];
}

/**
 * Send a text chat message to the backend (with optional image)
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    let response: Response;
    
    if (request.image) {
      // Send as multipart/form-data if image is present
      const formData = new FormData();
      formData.append('image', request.image);
      formData.append('query', request.query);
      formData.append('language', request.language);
      formData.append('use_rag', (request.use_rag ?? true).toString());
      if (request.conversation_id) {
        formData.append('conversation_id', request.conversation_id);
      }
      formData.append('temperature', (request.temperature ?? 0.7).toString());
      if (request.conversation_history && request.conversation_history.length > 0) {
        formData.append('conversation_history', JSON.stringify(request.conversation_history));
      }
      
      response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Send as JSON if no image
      response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          language: request.language,
          use_rag: request.use_rag,
          conversation_id: request.conversation_id,
          temperature: request.temperature,
          conversation_history: request.conversation_history,
        }),
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

/**
 * Send a voice message to the backend
 */
export async function sendVoiceMessage(
  audioFile: File,
  language: 'hi' | 'mr' | 'en' = 'hi',
  conversationId?: string,
  useRag: boolean = true
): Promise<VoiceChatResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    if (conversationId) {
      formData.append('conversation_id', conversationId);
    }
    formData.append('use_rag', useRag.toString());

    const response = await fetch(`${API_BASE_URL}/api/voice-chat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Voice chat API error:', error);
    throw error;
  }
}

/**
 * Get supported languages
 */
export async function getSupportedLanguages(): Promise<LanguagesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/languages`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Languages API error:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

/**
 * WebSocket connection for real-time chat
 */
export function createWebSocketConnection(
  conversationId: string = 'default',
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const wsUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
  const ws = new WebSocket(`${wsUrl}/ws/chat?conversation_id=${conversationId}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError?.(error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
    onClose?.();
  };

  return ws;
}

