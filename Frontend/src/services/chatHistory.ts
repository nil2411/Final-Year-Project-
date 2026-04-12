/**
 * Chat History Service
 * Manages saving and loading chat conversations from localStorage
 */

import { Message } from '@/types/chatbot.types';

export interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;
}

const STORAGE_KEY = 'krishibot_chat_history';
const MAX_CONVERSATIONS = 50; // Limit number of stored conversations

/**
 * Get all saved conversations
 */
export function getChatHistory(): ChatConversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored) as ChatConversation[];
    // Convert date strings back to Date objects
    return conversations.map(conv => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}

/**
 * Save a conversation
 */
export function saveConversation(conversation: ChatConversation): void {
  try {
    const conversations = getChatHistory();
    
    // Check if conversation already exists
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    if (existingIndex >= 0) {
      // Update existing conversation
      conversations[existingIndex] = {
        ...conversation,
        updatedAt: new Date(),
      };
    } else {
      // Add new conversation
      conversations.unshift(conversation);
      
      // Limit number of conversations
      if (conversations.length > MAX_CONVERSATIONS) {
        conversations.splice(MAX_CONVERSATIONS);
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Get a specific conversation by ID
 */
export function getConversation(id: string): ChatConversation | null {
  const conversations = getChatHistory();
  return conversations.find(c => c.id === id) || null;
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  try {
    const conversations = getChatHistory();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

/**
 * Clear all chat history
 */
export function clearChatHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}

/**
 * Generate a conversation title from the first user message
 */
export function generateConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.sender === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    // Remove image indicators and get first 50 chars
    const cleanContent = content.replace(/📷.*\n/g, '').trim();
    return cleanContent.length > 50 
      ? cleanContent.substring(0, 50) + '...' 
      : cleanContent || 'New Conversation';
  }
  return 'New Conversation';
}

/**
 * Auto-save conversation (called after each message)
 */
export function autoSaveConversation(
  conversationId: string,
  messages: Message[],
  title?: string
): string {
  // Generate or use provided title
  const convTitle = title || generateConversationTitle(messages);
  
  // Find existing conversation or create new
  const conversations = getChatHistory();
  let conversation = conversations.find(c => c.conversationId === conversationId);
  
  if (!conversation) {
    // Create new conversation
    conversation = {
      id: `conv_${Date.now()}`,
      title: convTitle,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      conversationId,
    };
  }
  
  // Update messages and timestamp
  conversation.messages = messages;
  conversation.updatedAt = new Date();
  
  // Update title if it's still "New Conversation" and we have user messages
  if (conversation.title === 'New Conversation' && messages.length > 1) {
    conversation.title = convTitle;
  }
  
  saveConversation(conversation);
  return conversation.id;
}

