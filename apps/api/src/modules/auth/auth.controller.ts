import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }

  @Post('token/refresh')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: any, @Body('refreshToken') refreshToken: string) {
    return this.authService.logout(user.id, refreshToken);
  }
}
