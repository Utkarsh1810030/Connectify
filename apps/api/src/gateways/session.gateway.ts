import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '../modules/sessions/sessions.service';
import { EVENT_BUS, IEventBus } from '../infrastructure/event-bus/event-bus.interface';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({ namespace: '/session', cors: { origin: '*' } })
export class SessionGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer() server: Server;

  constructor(
    private readonly sessionsService: SessionsService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  onModuleInit() {
    // Forward internal billing events to connected clients
    this.eventBus.on('billing.low_balance', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('low_balance_warning', { remainingBalance: payload.remainingBalance });
    });
    this.eventBus.on('billing.session_end', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('session_ended', { sessionId: payload.sessionId, reason: 'low_balance' });
      this.sessionsService.end(payload.sessionId, 'low_balance').catch(() => {});
    });
    this.eventBus.on('session.ended', (payload: any) => {
      this.server.to(`session:${payload.sessionId}`).emit('session_ended', payload);
    });
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) client.join(`user:${userId}`);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    client.join(`session:${data.sessionId}`);
    return { event: 'joined_session', data: { sessionId: data.sessionId } };
  }

  @SubscribeMessage('start_session')
  async handleStartSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.start(data.sessionId, userId);
    this.server.to(`session:${data.sessionId}`).emit('session_started', session);
    return { event: 'session_started', data: session };
  }

  @SubscribeMessage('end_session')
  async handleEndSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.end(data.sessionId, 'user_ended');
    this.server.to(`session:${data.sessionId}`).emit('session_ended', { sessionId: data.sessionId, reason: 'user_ended' });
    return { event: 'session_ended', data: session };
  }
}
