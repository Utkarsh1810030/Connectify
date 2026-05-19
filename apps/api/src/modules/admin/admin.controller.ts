import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ModerationService } from '../moderation/moderation.service';
import { SessionsService } from '../sessions/sessions.service';
import { ProvidersService } from '../providers/providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly moderationService: ModerationService,
    private readonly sessionsService: SessionsService,
    private readonly providersService: ProvidersService,
  ) { }

  @Get('users')
  listUsers(@Query('page') page?: number, @Query('limit') limit?: number, @Query('search') search?: string) {
    return this.adminService.listUsers({ page, limit, search });
  }

  @Post('users/:id/ban')
  banUser(@Param('id') id: string) { return this.adminService.banUser(id); }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string) { return this.adminService.unbanUser(id); }

  @Get('providers')
  listProviders(@Query('page') page?: number, @Query('limit') limit?: number, @Query('approved') approved?: boolean) {
    return this.adminService.listProviders({ page, limit, approved });
  }

  @Post('providers/:id/approve')
  approveProvider(@Param('id') id: string) { return this.adminService.approveProvider(id); }

  @Post('providers/:id/kyc/review')
  reviewKyc(
    @Param('id') id: string,
    @Body('decision') decision: 'approved' | 'rejected',
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.providersService.reviewKyc(id, decision, rejectionReason);
  }

  @Get('reports')
  listReports(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.moderationService.getReports({ page, limit, status });
  }

  @Patch('reports/:id')
  updateReport(@Param('id') id: string, @Body('status') status: string) {
    return this.moderationService.updateReport(id, status);
  }

  @Get('payouts')
  listPayouts(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.adminService.listPayouts({ page, limit, status });
  }

  @Post('payouts/:id/process')
  processPayout(@Param('id') id: string, @Body('bankReference') bankReference: string) {
    return this.adminService.processPayout(id, bankReference);
  }

  @Get('sessions')
  listSessions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.sessionsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
