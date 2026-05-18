export type MessageType = 'text' | 'image' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  isFiltered: boolean;
  createdAt: Date;
  readAt: Date | null;
}

export interface SendMessageDto {
  conversationId: string;
  type: MessageType;
  content: string;
}

export interface Conversation {
  id: string;
  sessionId: string;
  participants: [string, string];
  createdAt: Date;
  lastMessageAt: Date | null;
}

// WebSocket event payloads
export interface WsNewMessage {
  message: Message;
}

export interface WsTyping {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface WsPresence {
  userId: string;
  isOnline: boolean;
}
