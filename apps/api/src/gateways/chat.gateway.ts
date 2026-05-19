import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../modules/chat/chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) { }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) client.join(`user:${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) client.leave(`user:${userId}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conv:${data.conversationId}`);
    return { event: 'joined', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; sessionId: string; content: string; type?: string },
  ) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };

    const message = await this.chatService.sendMessage(
      data.conversationId, userId, data.sessionId, data.content, data.type,
    );

    this.server.to(`conv:${data.conversationId}`).emit('new_message', message);
    return { event: 'message_sent', data: message };
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; isTyping: boolean }) {
    const userId = client.handshake.auth?.userId;
    client.to(`conv:${data.conversationId}`).emit('typing', { userId, isTyping: data.isTyping });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return;
    await this.chatService.markRead(data.conversationId, userId);
    client.to(`conv:${data.conversationId}`).emit('messages_read', { userId, conversationId: data.conversationId });
  }
}
