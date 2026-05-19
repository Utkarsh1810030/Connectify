import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { ProvidersModule } from '../providers/providers.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ModerationModule } from '../moderation/moderation.module';
import { BillingModule } from '../billing/billing.module';
import { UserEntity } from '../users/entities/user.entity';
import { ProviderProfileEntity } from '../providers/entities/provider-profile.entity';
import { PayoutEntity } from '../billing/entities/payout.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProviderProfileEntity, PayoutEntity]),
    UsersModule, ProvidersModule, SessionsModule, ModerationModule, BillingModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule { }
