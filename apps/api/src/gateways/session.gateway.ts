import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '../modules/sessions/sessions.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { EVENT_BUS, IEventBus } from '../infrastructure/event-bus/event-bus.interface';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({ namespace: '/session', cors: { origin: '*' } })
export class SessionGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer() server: Server;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly notificationsService: NotificationsService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) { }

  onModuleInit() {
    this.eventBus.on('session.created', (payload: any) => {
      this.server.to(`provider:${payload.providerId}`).emit('session_request', {
        sessionId: payload.sessionId, userId: payload.userId,
        type: payload.type, ratePerMin: payload.ratePerMin,
      });
      this.notificationsService.sendPush(
        payload.providerId,
        'New Session Request',
        `A user wants a ${payload.type} session (₹${payload.ratePerMin}/min)`,
        { type: 'session_request', sessionId: payload.sessionId },
      ).catch(() => { });
    });

    this.eventBus.on('session.accepted', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('session_accepted', { sessionId: payload.sessionId });
    });

    this.eventBus.on('session.declined', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('session_declined', { sessionId: payload.sessionId });
    });

    this.eventBus.on('session.cancelled', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('session_cancelled', {
        sessionId: payload.sessionId, reason: payload.reason,
      });
    });

    this.eventBus.on('billing.low_balance', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('low_balance_warning', { remainingBalance: payload.remainingBalance });
    });
    this.eventBus.on('billing.session_end', (payload: any) => {
      this.server.to(`user:${payload.userId}`).emit('session_ended', { sessionId: payload.sessionId, reason: 'low_balance' });
      this.sessionsService.end(payload.sessionId, 'low_balance').catch(() => { });
    });
    this.eventBus.on('session.ended', (payload: any) => {
      this.server.to(`session:${payload.sessionId}`).emit('session_ended', payload);
    });
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) {
      client.join(`user:${userId}`);
      client.join(`provider:${userId}`);
    }
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

  @SubscribeMessage('accept_session')
  async handleAcceptSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.accept(data.sessionId, userId);
    this.server.to(`session:${data.sessionId}`).emit('session_accepted', { sessionId: data.sessionId });
    return { event: 'session_accepted', data: session };
  }

  @SubscribeMessage('decline_session')
  async handleDeclineSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.decline(data.sessionId, userId);
    this.server.to(`session:${data.sessionId}`).emit('session_declined', { sessionId: data.sessionId });
    return { event: 'session_declined', data: session };
  }

  @SubscribeMessage('end_session')
  async handleEndSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.end(data.sessionId, 'user_ended');
    this.server.to(`session:${data.sessionId}`).emit('session_ended', { sessionId: data.sessionId, reason: 'user_ended' });
    return { event: 'session_ended', data: session };
  }

  @SubscribeMessage('pause_session')
  async handlePauseSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.pause(data.sessionId, userId);
    this.server.to(`session:${data.sessionId}`).emit('session_paused', { sessionId: data.sessionId });
    return { event: 'session_paused', data: session };
  }

  @SubscribeMessage('resume_session')
  async handleResumeSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    const userId = client.handshake.auth?.userId;
    if (!userId) return { event: 'error', data: 'Unauthorized' };
    const session = await this.sessionsService.resume(data.sessionId, userId);
    this.server.to(`session:${data.sessionId}`).emit('session_resumed', { sessionId: data.sessionId });
    return { event: 'session_resumed', data: session };
  }
}
