import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Validates userId from Socket.io handshake auth for WebSocket connections
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    return !!client.handshake?.auth?.userId;
  }
}
