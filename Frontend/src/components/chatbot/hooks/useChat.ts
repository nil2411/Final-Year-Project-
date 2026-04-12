import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, QuickAction } from '@/types/chatbot.types';
import { getDefaultQuickQuestions } from '../components/QuickActions';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendChatMessage, createWebSocketConnection, type ChatRequest, type ChatResponse } from '@/services/api';
import { autoSaveConversation, type ChatConversation } from '@/services/chatHistory';
import { detectLanguage, normalizeLanguageCode } from '@/utils/languageDetection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const useChat = () => {
  const { currentLanguage } = useLanguage();
  const { t } = useLanguage();
  const conversationIdRef = useRef<string>(`conv_${Date.now()}`);
  const wsRef = useRef<WebSocket | null>(null);
  const conversationIdForHistoryRef = useRef<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const greetingText = t('chat.greeting', {}) || 'Hello! I\'m your farming assistant. How can I help you today?';
    return [
      {
        id: '1',
        content: greetingText,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          ttsText: greetingText,
          audioUrl: '',
        },
      },
    ];
  });

  const [quickActions, setQuickActions] = useState(() => getDefaultQuickQuestions(currentLanguage));
  
  // Update quick questions when language changes
  useEffect(() => {
    setQuickActions(getDefaultQuickQuestions(currentLanguage));
  }, [currentLanguage]);

  // Update quick questions based on conversation context (optional - can be disabled to always show default)
  // useEffect(() => {
  //   // Show default questions for now - contextual questions can be added later if needed
  //   setQuickActions(getDefaultQuickQuestions(currentLanguage));
  // }, [messages, currentLanguage]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Auto-save conversation after messages change
  useEffect(() => {
    if (messages.length > 1) {
      const convId = conversationIdForHistoryRef.current || conversationIdRef.current;
      autoSaveConversation(convId, messages);
    }
  }, [messages]);

  const sendMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const formatAIResponse = useCallback((response: ChatResponse): string => {
    const sections: string[] = [];

    // Title
    if (response.title) {
      sections.push(`<b>${response.title}</b>`);
    }

    // Summary (short + detailed)
    if (response.summary_short) {
      sections.push(`<b>Summary:</b><br>${response.summary_short}`);
    }
    if (response.summary_detailed) {
      sections.push(response.summary_detailed);
    }

    // Timing
    if (response.timing) {
      sections.push(`📅 <b>Timing:</b><br>${response.timing}`);
    }

    // Inputs and rates
    if (response.inputs_and_rates && response.inputs_and_rates.length > 0) {
      const inputsText = response.inputs_and_rates
        .filter(inp => inp.name && inp.value)
        .map(inp => `- ${inp.name}: ${inp.value}${inp.notes ? ` (${inp.notes})` : ''}`)
        .join('<br>');
      if (inputsText) {
        sections.push(`📊 <b>Inputs & Rates:</b><br>${inputsText}`);
      }
    }

    // Steps (brief + detailed pairs)
    if (response.steps_brief && response.steps_brief.length > 0) {
      const stepsText = response.steps_brief
        .map((brief, idx) => {
          const detailed = response.steps_detailed?.[idx] || '';
          if (detailed) {
            return `${idx + 1}. ${brief}<br>&nbsp;&nbsp;${detailed}`;
          }
          return `${idx + 1}. ${brief}`;
        })
        .join('<br><br>');
      sections.push(`🧑‍🌾 <b>Steps:</b><br>${stepsText}`);
    }

    // Monitoring and signs
    if (response.monitoring_and_signs && response.monitoring_and_signs.length > 0) {
      const monitoringText = response.monitoring_and_signs
        .map(item => `- ${item}`)
        .join('<br>');
      sections.push(`👀 <b>Monitoring & Signs:</b><br>${monitoringText}`);
    }

    // Urgent action
    if (response.urgent_action && response.urgent_action.length > 0) {
      const urgentText = response.urgent_action
        .map(item => `⚠️ ${item}`)
        .join('<br>');
      sections.push(`🚨 <b>Urgent Action:</b><br>${urgentText}`);
    }

    // Recommendation
    if (response.recommendation) {
      sections.push(`💡 <b>Recommendation:</b><br>${response.recommendation}`);
    }

    // Regional adaptations
    if (response.regional_adaptations) {
      sections.push(`🌍 <b>Regional Adaptations:</b><br>${response.regional_adaptations}`);
    }

    // Follow-up questions
    if (response.follow_up_questions && response.follow_up_questions.length > 0) {
      const questionsText = response.follow_up_questions
        .map((q, idx) => `${idx + 1}. ${q}`)
        .join('<br>');
      sections.push(`❓ <b>Follow-up Questions:</b><br>${questionsText}`);
    }

    // Notes for farmer
    if (response.notes_for_farmer) {
      sections.push(`📝 <b>Notes:</b><br>${response.notes_for_farmer}`);
    }

    // Fallback to old format if new fields are missing
    if (sections.length === 0) {
      if (response.summary) sections.push(`<b>Summary:</b><br>${response.summary}`);
      if (response.steps && response.steps.length > 0) {
        sections.push(`<b>Steps:</b><br>${response.steps.map((s, i) => `${i + 1}. ${s}`).join('<br>')}`);
      }
      if (response.recommendation) sections.push(`<b>Recommendation:</b><br>${response.recommendation}`);
      if (response.follow_up && response.follow_up.length > 0) {
        sections.push(`<b>Follow-up:</b><br>${response.follow_up.map((q, i) => `${i + 1}. ${q}`).join('<br>')}`);
      }
    }

    return sections.join('\n\n').trim();
  }, []);

  const processUserInput = useCallback(async (input: string, imageFile?: File) => {
    if (!input.trim() && !imageFile) return;

    // Add user message
    sendMessage({
      content: imageFile ? `📷 ${imageFile.name}\n${input || 'Analyzing image...'}` : input,
      sender: 'user',
      type: imageFile ? 'image' : 'text',
      timestamp: new Date(),
    });

    setIsLoading(true);

    try {
      // Auto-detect language from user input
      let detectedLanguage = currentLanguage;
      if (input && input.trim().length > 0) {
        const detected = detectLanguage(input);
        // Use detected language if it's different from current, or if current is not set
        if (detected && detected !== currentLanguage) {
          detectedLanguage = detected;
          console.log(`🌐 Auto-detected language: ${detected} (from query)`);
        }
      }
      
      // Normalize language code for backend compatibility
      const backendLanguage = normalizeLanguageCode(detectedLanguage);

      // Prepare conversation history (exclude system/greeting messages)
      // Include pairs of user messages and AI responses in chronological order
      const conversationHistory = messages
        .filter(m => m.sender !== 'system' && m.id !== '1') // Exclude greeting
        .map(m => {
          // Clean content - remove image indicators but keep the actual content
          let content = m.content;
          // Remove image file name prefix but keep the actual query
          // Pattern: 📷 filename.jpg\nactual query -> actual query
          content = content.replace(/^📷\s*[^\n]+\n?/g, '').trim();
          // Also handle cases where image filename is in the content
          content = content.replace(/images?\.(jpeg|jpg|png|gif|webp)\s*/gi, '').trim();
          
          return {
            role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: content,
          };
        })
        .filter(m => m.content.length > 0); // Only include non-empty messages
      
      // Debug: Log conversation history being sent
      if (conversationHistory.length > 0) {
        console.log(`\n📝 Sending ${conversationHistory.length} messages as context:`);
        conversationHistory.forEach((msg, idx) => {
          console.log(`  [${idx + 1}] ${msg.role}: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}`);
        });
      }

      // Call backend API
      const request: ChatRequest = {
        query: input || (imageFile ? 'Please analyze this image' : ''),
        language: backendLanguage,
        use_rag: true,
        conversation_id: conversationIdRef.current,
        image: imageFile,
        conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
      };

      const response = await sendChatMessage(request);

      const resolvedAudioUrl = response.audio_url
        ? (response.audio_url.startsWith('http') ? response.audio_url : `${API_BASE_URL}${response.audio_url}`)
        : '';

      // Add AI response
      const formattedContent = formatAIResponse(response);

      sendMessage({
        content: formattedContent || 'I\'m sorry, I could not generate a response. Please try again.',
        sender: 'ai',
        type: 'text',
        timestamp: new Date(),
        metadata: {
          title: response.title,
          confidence: response.confidence,
          summary_short: response.summary_short,
          summary_detailed: response.summary_detailed,
          timing: response.timing,
          inputs_and_rates: response.inputs_and_rates,
          steps_brief: response.steps_brief,
          steps_detailed: response.steps_detailed,
          monitoring_and_signs: response.monitoring_and_signs,
          urgent_action: response.urgent_action,
          recommendation: response.recommendation,
          regional_adaptations: response.regional_adaptations,
          follow_up_questions: response.follow_up_questions,
          notes_for_farmer: response.notes_for_farmer,
          sources: response.sources,
          audioUrl: resolvedAudioUrl,
          ttsText: response.tts_text,
          // Backward compatibility
          summary: response.summary || response.summary_short,
          steps: response.steps || response.steps_brief,
          followUp: response.follow_up || response.follow_up_questions,
          raw: response,
        },
      });

      // Optional auto-play placeholder (disabled by default)
      // if (resolvedAudioUrl) {
      //   const audio = new Audio(resolvedAudioUrl);
      //   audio.play().catch(err => console.error('Audio play error:', err));
      // }

    } catch (error) {
      console.error('Error processing user input:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('LLM service is not available')) {
          errorMessage = 'AI service is not available. Please check if the backend server is running and the OpenAI API key is configured. Visit /health for more details.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Cannot connect to the backend server. Please make sure the server is running on http://localhost:8000';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Add error message with ttsText for audio playback
      sendMessage({
        content: errorMessage,
        sender: 'ai',
        type: 'text',
        timestamp: new Date(),
        metadata: {
          ttsText: errorMessage,
          audioUrl: '',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage, currentLanguage]);

  // Optional: WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    wsRef.current = createWebSocketConnection(
      conversationIdRef.current,
      (data) => {
        if (data.type === 'status') {
          // Handle status updates (e.g., "retrieving", "generating")
          console.log('Status:', data.data.status);
        } else if (data.type === 'partial') {
          // Handle partial response
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.sender === 'ai') {
              return prev.map((msg, idx) => 
                idx === prev.length - 1 
                  ? { ...msg, content: data.data.summary_short || data.data.answer || '' }
                  : msg
              );
            }
            return prev;
          });
        } else if (data.type === 'complete') {
          // Handle complete response
          const response = data.data;
          const resolvedAudioUrl = response.audio_url
            ? (response.audio_url.startsWith('http') ? response.audio_url : `${API_BASE_URL}${response.audio_url}`)
            : '';
          const formattedContent = formatAIResponse(response as ChatResponse);
          sendMessage({
            content: formattedContent || 'I\'m sorry, I could not generate a response. Please try again.',
            sender: 'ai',
            type: 'text',
            timestamp: new Date(),
            metadata: {
              title: response.title,
              confidence: response.confidence,
              summary_short: response.summary_short,
              summary_detailed: response.summary_detailed,
              timing: response.timing,
              inputs_and_rates: response.inputs_and_rates,
              steps_brief: response.steps_brief,
              steps_detailed: response.steps_detailed,
              monitoring_and_signs: response.monitoring_and_signs,
              urgent_action: response.urgent_action,
              recommendation: response.recommendation,
              regional_adaptations: response.regional_adaptations,
              follow_up_questions: response.follow_up_questions,
              notes_for_farmer: response.notes_for_farmer,
              sources: response.sources,
              audioUrl: resolvedAudioUrl,
              ttsText: response.tts_text,
              raw: response,
            },
          });
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.data);
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
      },
      () => {
        console.log('WebSocket closed');
        wsRef.current = null;
      }
    );
  }, [sendMessage]);

  const loadConversation = useCallback((conversation: ChatConversation) => {
    conversationIdForHistoryRef.current = conversation.id;
    conversationIdRef.current = conversation.conversationId;
    setMessages(conversation.messages);
  }, []);

  const startNewConversation = useCallback(() => {
    conversationIdRef.current = `conv_${Date.now()}`;
    conversationIdForHistoryRef.current = null;
    const greetingText = t('chat.greeting', {}) || 'Hello! I\'m your farming assistant. How can I help you today?';
    setMessages([
      {
        id: '1',
        content: greetingText,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          ttsText: greetingText,
          audioUrl: '',
        },
      },
    ]);
  }, [t]);

  return {
    messages,
    sendMessage,
    processUserInput,
    quickActions,
    isLoading,
    connectWebSocket,
    loadConversation,
    startNewConversation,
    currentConversationId: conversationIdRef.current,
  };
};
