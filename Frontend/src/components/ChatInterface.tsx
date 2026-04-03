import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, X, MicOff, Image, Brain, Volume2, VolumeX, Sparkles, MessageSquare, Table, Link, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import farmerAvatar from '@/assets/farmer-avatar.png';
import { AgenticAI } from '@/components/AgenticAI';
import { VoiceInterface } from '@/components/VoiceInterface';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'agent';
  timestamp: Date;
  type: 'text' | 'image' | 'voice' | 'table' | 'list' | 'rich';
  metadata?: {
    confidence?: number;
    suggestions?: string[];
    links?: { text: string; url: string }[];
    images?: string[];
    tables?: { headers: string[]; rows: string[][] }[];
    responseType?: 'recommendation' | 'analysis' | 'alert' | 'info';
  };
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  agentMode?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  agentMode = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'नमस्ते! मैं आपका KrishiSaathi हूँ। आपकी खेती में कैसे मदद कर सकता हूँ?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'rich',
      metadata: {
        responseType: 'info',
        suggestions: ['मिट्टी टेस्ट करवाना चाहता हूँ', 'नई योजनाओं के बारे में बताएं', 'फसल की बीमारी देखनी है', 'खाद की सिफारिश चाहिए'],
      },
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [showAgentMode, setShowAgentMode] = useState(agentMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Enhanced message sending with context awareness
  const sendMessage = (content: string, type: 'text' | 'image' | 'voice' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setConversationContext(prev => [...prev.slice(-4), content]);
    setInputText('');
    
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        const aiResponse = generateEnhancedAIResponse(content);
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 2000);
    }, 500);
  };

  const generateEnhancedAIResponse = (userMessage: string): Message => {
    const responses = [
      'मैं आपकी मिट्टी और फसल के बारे में जानकारी दे सकता हूँ। कृपया अपनी समस्या विस्तार से बताएं।',
      'आपकी फसल के लिए सबसे उपयुक्त खाद की सिफारिश करने के लिए मुझे कुछ और जानकारी चाहिए।',
      'मैं सरकारी योजनाओं की जानकारी भी दे सकता हूँ। किस तरह की मदद चाहिए?',
      'फसल की बीमारी के लिए फोटो अपलोड करें, मैं तुरंत पहचान कर दूंगा।',
    ];
    
    return {
      id: (Date.now() + 1).toString(),
      content: responses[Math.floor(Math.random() * responses.length)],
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inputText.trim()) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendMessage(`📷 Image uploaded: ${file.name}`, 'image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-4 lg:inset-8">
        <Card className="h-full flex flex-col gradient-earth shadow-float">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/20">
            <div className="flex items-center space-x-3">
              <img src={farmerAvatar} alt="KrishiSaathi" className="h-10 w-10 rounded-full" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">KrishiSaathi AI</h2>
                <p className="text-sm text-muted-foreground">आपका खेती सहायक • Online</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-accent/50">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/20">
            <div className="flex items-end space-x-3">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-full">
                <Camera className="h-5 w-5" />
              </Button>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="आपकी खेती की समस्या बताएं..."
                className="h-12 rounded-full px-4"
              />
              <Button
                onClick={() => inputText.trim() && sendMessage(inputText)}
                disabled={!inputText.trim()}
                className="h-12 w-12 rounded-full gradient-primary"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};