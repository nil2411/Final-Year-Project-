export type MessageType = 'text' | 'image' | 'voice' | 'action';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  type: MessageType;
  metadata?: {
    [key: string]: any;
  };
}

export interface QuickAction {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: 'weather' | 'crop' | 'market' | 'scheme' | 'reminder';
}

export interface AgentResponse {
  response: string;
  action?: {
    type: string;
    payload: any;
  };
}

export interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  quickActions: QuickAction[];
}
