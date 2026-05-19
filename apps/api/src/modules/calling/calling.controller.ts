import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CallingService } from './calling.service';
import { SessionsService } from '../sessions/sessions.service';
import { ConfigService } from '@nestjs/config';

@Controller('calling')
@UseGuards(JwtAuthGuard)
export class CallingController {
  constructor(
    private readonly callingService: CallingService,
    private readonly sessionsService: SessionsService,
    private readonly config: ConfigService,
  ) { }

  @Get('token')
  async getToken(
    @CurrentUser() user: { id: string },
    @Query('sessionId') sessionId: string,
  ) {
    const session = await this.sessionsService.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    const isProvider = session.providerId === user.id;
    const role = isProvider ? 'publisher' : 'publisher';
    const channelId = session.agoraChannelId ?? await this.callingService.createChannel(sessionId);
    const token = await this.callingService.generateToken(channelId, user.id, role);

    return {
      token,
      channelId,
      appId: this.config.get<string>('AGORA_APP_ID'),
      uid: 0,
    };
  }
}
