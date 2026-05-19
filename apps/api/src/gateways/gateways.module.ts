import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { SessionGateway } from './session.gateway';
import { PresenceGateway } from './presence.gateway';
import { ChatModule } from '../modules/chat/chat.module';
import { SessionsModule } from '../modules/sessions/sessions.module';
import { ProvidersModule } from '../modules/providers/providers.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [ChatModule, SessionsModule, ProvidersModule, NotificationsModule],
  providers: [ChatGateway, SessionGateway, PresenceGateway],
})
export class GatewaysModule { }
