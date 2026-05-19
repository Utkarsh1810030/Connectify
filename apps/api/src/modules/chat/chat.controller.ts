import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SessionsService } from '../sessions/sessions.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly sessionsService: SessionsService,
  ) { }

  @Post('conversations')
  async getOrCreate(
    @CurrentUser() user: { id: string },
    @Body('sessionId') sessionId: string,
  ) {
    const session = await this.sessionsService.findById(sessionId);
    return this.chatService.getOrCreateConversation(sessionId, [session.userId, session.providerId]);
  }

  @Get('messages/:conversationId')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(conversationId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
