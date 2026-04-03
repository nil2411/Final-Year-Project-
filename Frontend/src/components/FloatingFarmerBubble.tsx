import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, X, Send, Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChat } from './chatbot/hooks/useChat';
import type { Message as MessageType } from '@/types/chatbot.types';
import logo1 from '@/assets/logo1.png';

interface FloatingFarmerBubbleProps {
  onOpenChat: (e?: React.MouseEvent) => void;
  isMinimized: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export const FloatingFarmerBubble: React.FC<FloatingFarmerBubbleProps> = ({
  onOpenChat,
  isMinimized,
  position = { x: window.innerWidth - 100, y: window.innerHeight - 100 },
  onPositionChange = () => {},
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentMessage, setCurrentMessage] = useState('');
  const { messages, sendMessage, processUserInput } = useChat();
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);
  const [imageError, setImageError] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number>();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage((prev) => prev + transcript);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragged) {
      setDragged(false);
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setIsDragging(true);
      setDragged(false);
      document.body.style.userSelect = 'none';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!bubbleRef.current) return;

    const rect = bubbleRef.current.getBoundingClientRect();
    const bubbleWidth = rect.width;
    const bubbleHeight = rect.height;
    const padding = 10;

    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;

    const maxX = window.innerWidth - bubbleWidth - padding;
    const maxY = window.innerHeight - bubbleHeight - padding;

    const constrainedX = Math.max(padding, Math.min(newX, maxX));
    const constrainedY = Math.max(padding, Math.min(newY, maxY));

    setCurrentPosition({ x: constrainedX, y: constrainedY });
    onPositionChange({ x: constrainedX, y: constrainedY });
    setDragged(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      cancelAnimationFrame(animationFrame.current!);
      animationFrame.current = requestAnimationFrame(() =>
        updatePosition(e.clientX, e.clientY)
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      cancelAnimationFrame(animationFrame.current!);
      animationFrame.current = requestAnimationFrame(() =>
        updatePosition(touch.clientX, touch.clientY)
      );
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, dragOffset]);

  const handleExpandRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/chat');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = currentMessage.trim();
    if (!message) return;

    sendMessage({
      content: message,
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
    });
    setCurrentMessage('');
    setIsProcessing(true);

    try {
      await processUserInput(message);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const adjustedX = Math.min(
    currentPosition.x,
    window.innerWidth - (isExpanded ? 320 : 64) - 10
  );
  const adjustedY = Math.min(
    currentPosition.y,
    window.innerHeight - (isExpanded ? 500 : 64) - 10
  );

  return (
    <div
      ref={bubbleRef}
      className={`fixed z-50 ${
        isExpanded ? 'w-80 h-[500px]' : 'w-16 h-16'
      } ${isDragging ? '' : 'transition-all duration-200 ease-in-out'}`}
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        touchAction: 'none',
      }}
    >
      {isExpanded ? (
        <Card className="h-full w-full shadow-float overflow-hidden flex flex-col rounded-2xl">
          <CardHeader
            className="chat-header bg-primary text-primary-foreground p-3 cursor-move select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={logo1}
                  alt="Logo"
                  className="h-7 w-7 rounded-full border-2 border-white object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="font-medium">AI Assistant</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={handleExpandRedirect}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 h-[calc(100%-3.5rem)] bg-background">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-3">
                {messages.slice(-5).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="mt-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isProcessing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`text-primary ${listening ? 'text-red-500' : ''}`}
                >
                  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={!currentMessage.trim() || isProcessing}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          className="h-16 w-16 rounded-full p-0 overflow-hidden shadow-float hover:shadow-glow transition-transform duration-200"
          aria-label="Open chat"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleBubbleClick}
        >
          {!imageError ? (
            <img
              src={logo1}
              alt="Chat Logo"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              draggable="false"
            />
          ) : (
            <Maximize2 className="h-6 w-6 text-white" />
          )}
        </Button>
      )}
    </div>
  );
};

export default FloatingFarmerBubble;
