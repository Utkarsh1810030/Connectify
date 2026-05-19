import {
  WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProvidersService } from '../modules/providers/providers.service';

@WebSocketGateway({ namespace: '/presence', cors: { origin: '*' } })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly providersService: ProvidersService) { }

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    const role = client.handshake.auth?.role;
    if (!userId) return client.disconnect();

    client.join(`user:${userId}`);

    if (role === 'provider') {
      await this.providersService.updateOnlineStatus(userId, true);
      this.server.emit('provider_online', { userId });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId;
    const role = client.handshake.auth?.role;
    if (userId && role === 'provider') {
      await this.providersService.updateOnlineStatus(userId, false);
      this.server.emit('provider_offline', { userId });
    }
  }
}
