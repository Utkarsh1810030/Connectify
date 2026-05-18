import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
interface JwtPayload { sub: string; phone: string; role: string; }
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.isBanned) throw new UnauthorizedException();
    return user;
  }
}
