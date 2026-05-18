import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  list(@Query('category') category?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.providersService.list({ category, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateProviderProfileDto) {
    return this.providersService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  update(@CurrentUser() user: UserEntity, @Body() dto: UpdateProviderProfileDto) {
    return this.providersService.update(user.id, dto);
  }
}
