import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chatbot.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
}

// Helper to strip HTML tags/entities and emojis from a string
function stripHtmlAndEmojis(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  // Remove most emojis and emoji symbols
  return text.replace(/([\u231A-\u231B]|\u23E9|\u23EA|\u23EB|\u23EC|[\u23F0-\u23F4]|\u2600-\u26FF|[\u2700-\u27BF]|[\u2B50-\u2B55]|[\u2934-\u2935]|[\u3030\u303D]|[\u3297\u3299]|[\uD83C-\uDBFF\uDC00-\uDFFF]+)/g, '');
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing }) => {
  const { t, currentLanguage } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioInstancesRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [loadingAudio, setLoadingAudio] = useState<Set<string>>(new Set());
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cleanup all audio instances on unmount
  useEffect(() => {
    return () => {
      audioInstancesRef.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioInstancesRef.current.clear();
    };
  }, []);

  // Stop other audio when a new one starts playing
  const stopOtherAudio = useCallback((currentMessageId: string) => {
    audioInstancesRef.current.forEach((audio, messageId) => {
      if (messageId !== currentMessageId) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingMessageId(currentMessageId);
  }, []);


  const handlePlayAudio = useCallback(
    async (messageId: string, message: Message) => {
      // If clicking the same message that's playing, stop it
      if (playingMessageId === messageId) {
        // Stop speech synthesis if active
        if (window.speechSynthesis?.speaking) {
          window.speechSynthesis.cancel();
        }
        // Stop audio if playing
        const audio = audioInstancesRef.current.get(messageId);
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingMessageId(null);
        return;
      }

      // Stop other audio and speech synthesis
      stopOtherAudio(messageId);
      window.speechSynthesis?.cancel();

      // Check if audio is already available
      let audioUrl = message.metadata?.audioUrl as string | undefined;
      // Use ttsText, but fallback to message.content for TTS
      const ttsText = message.metadata?.ttsText as string | undefined;
      let ttsCandidate = ttsText || message.content;
      // If ttsCandidate contains HTML (which is likely for AI message.content), strip it for speech synthesis
      if (!ttsText && message.sender === 'ai') {
        ttsCandidate = stripHtmlAndEmojis(message.content);
      }
      
      // If no audio URL, always use Speech Synthesis on the text (prefer ttsText if present, else full content)
      if (!audioUrl) {
        setLoadingAudio((prev) => new Set(prev).add(messageId));
        setPlayingMessageId(messageId);
        try {
          if ('speechSynthesis' in window) {
            const langMap: Record<string, string> = {
              'hi': 'hi-IN',
              'mr': 'mr-IN',
              'en': 'en-US',
            };
            const utterance = new SpeechSynthesisUtterance(ttsCandidate);
            utterance.lang = langMap[currentLanguage] || 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.onend = () => {
              setPlayingMessageId(null);
              setLoadingAudio((prev) => {
                const next = new Set(prev);
                next.delete(messageId);
                return next;
              });
            };
            utterance.onerror = (error) => {
              console.error('Speech synthesis error:', error);
              setPlayingMessageId(null);
              setLoadingAudio((prev) => {
                const next = new Set(prev);
                next.delete(messageId);
                return next;
              });
            };
            window.speechSynthesis.speak(utterance);
            setLoadingAudio((prev) => {
              const next = new Set(prev);
              next.delete(messageId);
              return next;
            });
          } else {
            throw new Error('Speech Synthesis not supported');
          }
        } catch (error) {
          console.error('Error generating audio:', error);
          setPlayingMessageId(null);
          setLoadingAudio((prev) => {
            const next = new Set(prev);
            next.delete(messageId);
            return next;
          });
        }
        return;
      }

      if (!audioUrl) {
        console.warn('No audio URL or TTS text available for message:', messageId);
        return;
      }

      // Get or create audio instance for this message
      let audio = audioInstancesRef.current.get(messageId);
      
      if (!audio) {
        const resolvedUrl = audioUrl.startsWith('http') || audioUrl.startsWith('blob:') 
          ? audioUrl 
          : `${API_BASE_URL}${audioUrl}`;
        
        audio = new Audio(resolvedUrl);
        audioInstancesRef.current.set(messageId, audio);

        // Clean up blob URL when audio ends
        audio.addEventListener('ended', () => {
          if (audioUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
          setPlayingMessageId(null);
        });

        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setPlayingMessageId(null);
        });
      }

      // If already playing, restart from beginning
      if (playingMessageId === messageId && !audio.paused) {
        audio.currentTime = 0;
        return;
      }

      setPlayingMessageId(messageId);
      try {
        await audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setPlayingMessageId(null);
      }
    },
    [stopOtherAudio, currentLanguage, playingMessageId]
  );

  const getAvatar = (sender: string) => {
    if (sender === 'ai') {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/krishi-avatar.png" alt="Krishi Saathi" />
          <AvatarFallback>KS</AvatarFallback>
        </Avatar>
      );
    }
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback>👤</AvatarFallback>
      </Avatar>
    );
  };

  const getMessageAlignment = (sender: string) => {
    return sender === 'user' ? 'justify-end' : 'justify-start';
  };

  const getMessageStyle = (sender: string) => {
    const baseStyle = 'max-w-[80%] p-3 rounded-2xl text-sm';
    return sender === 'user'
      ? `${baseStyle} bg-primary text-primary-foreground`
      : `${baseStyle} bg-muted text-muted-foreground`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn('flex items-start gap-3', getMessageAlignment(message.sender))}
        >
          {message.sender === 'ai' && (
            <div className="flex-shrink-0">
              {getAvatar(message.sender)}
            </div>
          )}
          <div className={cn('flex flex-col', message.sender === 'user' ? 'items-end' : 'items-start')}>
            <Card className={getMessageStyle(message.sender)}>
              <CardContent className="p-0 whitespace-pre-wrap leading-relaxed">
                {message.sender === 'ai' ? (
                  <span dangerouslySetInnerHTML={{ __html: message.content }} />
                ) : (
                  message.content
                )}
              </CardContent>
            </Card>
            {message.sender === 'ai' && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "mt-2 h-8 w-8 transition-colors",
                  playingMessageId === message.id
                    ? "text-primary hover:text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  handlePlayAudio(message.id, message);
                }}
                disabled={loadingAudio.has(message.id)}
                aria-label={playingMessageId === message.id ? "Stop audio" : "Play response audio"}
                title={playingMessageId === message.id ? "Playing..." : "Play audio"}
              >
                {loadingAudio.has(message.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className={cn("h-4 w-4", playingMessageId === message.id && "animate-pulse")} />
                )}
              </Button>
            )}
            <span className="text-xs text-muted-foreground mt-1">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {message.sender === 'user' && (
            <div className="flex-shrink-0">
              {getAvatar(message.sender)}
            </div>
          )}
        </div>
      ))}
      {isProcessing && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getAvatar('ai')}
          </div>
          <div className="flex flex-col items-start">
            <Card className="bg-muted text-muted-foreground max-w-[80%] p-3 rounded-2xl text-sm">
              <CardContent className="p-0 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">{t('chat.thinking', {}) || 'Thinking...'}</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
