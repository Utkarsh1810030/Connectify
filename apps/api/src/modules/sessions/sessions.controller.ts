import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';
import { StartSessionDto } from './dto/start-session.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: StartSessionDto) {
    return this.sessionsService.create(user.id, dto);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sessionsService.start(id, user.id);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sessionsService.pause(id, user.id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sessionsService.resume(id, user.id);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sessionsService.accept(id, user.id);
  }

  @Post(':id/decline')
  decline(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sessionsService.decline(id, user.id);
  }

  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.sessionsService.end(id, 'user_ended');
  }

  @Get('active')
  getActive(@CurrentUser() user: { id: string }) {
    return this.sessionsService.getActive(user.id);
  }

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.findByUser(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('as-provider')
  listAsProvider(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.findByProvider(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }
}
