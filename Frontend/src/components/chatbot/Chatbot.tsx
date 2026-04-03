import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Image, WifiOff, History, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChat } from './hooks/useChat';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import { MessageList } from './components/MessageList';
import { QuickQuestions } from './components/QuickActions';
import { useAgent } from './agents/useAgent';
import { Message } from '@/types/chatbot.types';
import { ChatHistory } from './components/ChatHistory';
import { ImageUploadModal } from './components/ImageUploadModal';
import type { ChatConversation } from '@/services/chatHistory';

export const Chatbot = () => {
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useOfflineStatus();
  const { t, currentLanguage } = useLanguage();
  
  const {
    messages,
    sendMessage,
    processUserInput,
    quickActions,
    isLoading,
    loadConversation,
    startNewConversation,
    currentConversationId,
  } = useChat();
  
  const { processWithAgent } = useAgent({
    onResponse: (response) => {
      // Handle agent response
      console.log('Agent response:', response);
    },
    onError: (error) => {
      console.error('Agent error:', error);
      // Handle error appropriately
    },
  });

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    setInputText('');
    await processUserInput(text);
  }, [processUserInput, isLoading]);

  const handleVoiceResult = useCallback((text: string) => {
    setInputText(text);
    handleSendMessage(text);
  }, [handleSendMessage]);

  const handleVoiceError = useCallback((error: Error) => {
    console.error('Voice recognition error:', error);
    // Handle error appropriately
  }, []);

  const {
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
    conversationId: currentConversationId,
  });
  
  const handleQuickAction = useCallback((action: string) => {
    handleSendMessage(action);
  }, [handleSendMessage]);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        e.target.value = '';
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        e.target.value = '';
        return;
      }
      
      // Show modal with image preview
      setSelectedImage(file);
      setShowImageModal(true);
      e.target.value = '';
    }
  }, []);

  const handleImageSend = useCallback(async (prompt: string, file: File) => {
    try {
      await processUserInput(prompt, file);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    }
  }, [processUserInput]);

  const handleSelectConversation = useCallback((conversation: ChatConversation) => {
    loadConversation(conversation);
  }, [loadConversation]);

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{t('app.title', {}) || 'Krishi Saathi'}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewConversation}
              title={t('chat.newConversation', {}) || 'New Conversation'}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
              title={t('chat.chatHistory', {}) || 'Chat History'}
            >
              <History className="h-4 w-4" />
            </Button>
            {!isOnline && (
              <div className="flex items-center text-yellow-600">
                <WifiOff className="h-4 w-4 mr-1" />
                <span className="text-sm">{t('chat.offline', {}) || 'Offline Mode'}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <MessageList messages={messages} isProcessing={isLoading} />
        {quickActions && quickActions.length > 0 && (
          <QuickQuestions 
            questions={quickActions} 
            onQuestionClick={handleQuickAction} 
            disabled={isLoading}
          />
        )}
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isLoading}
              title={t('chat.uploadImage', {}) || 'Upload Image'}
            >
              <Image className="h-4 w-4" />
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageSelect}
              />
            </Button>
            
            <Input
              placeholder={t('chat.placeholder', {}) || 'Type your message...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }
              }}
              disabled={isLoading}
              className="flex-1 rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            <Button 
              type="button"
              size="icon" 
              className="rounded-l-none"
              onClick={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              aria-label={t('chat.send', {}) || 'Send'}
            >
              <Send className="h-4 w-4" />
            </Button>
            
            {hasRecognitionSupport && (
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleVoiceInput}
                className="mr-2"
                disabled={!hasRecognitionSupport || isLoading}
                aria-label={t('chat.voice', {}) || 'Voice Input'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Chat History Sidebar */}
      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleSelectConversation}
        currentConversationId={currentConversationId}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageModal}
        imageFile={selectedImage}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
        }}
        onSend={handleImageSend}
      />
    </div>
  );
};
