import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserEntity } from './entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  getMe(@CurrentUser() user: UserEntity) {
    return user;
  }

  @Patch('me')
  updateMe(@CurrentUser() user: UserEntity, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
