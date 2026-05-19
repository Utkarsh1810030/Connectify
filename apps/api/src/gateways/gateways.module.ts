import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { SessionGateway } from './session.gateway';
import { PresenceGateway } from './presence.gateway';
import { ChatModule } from '../modules/chat/chat.module';
import { SessionsModule } from '../modules/sessions/sessions.module';
import { ProvidersModule } from '../modules/providers/providers.module';

@Module({
  imports: [ChatModule, SessionsModule, ProvidersModule],
  providers: [ChatGateway, SessionGateway, PresenceGateway],
})
export class GatewaysModule { }
