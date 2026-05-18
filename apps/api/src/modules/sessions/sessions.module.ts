import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './entities/session.entity';
import { SessionsService } from './sessions.service';
import { BillingModule } from '../billing/billing.module';
import { ProvidersModule } from '../providers/providers.module';
import { CallingModule } from '../calling/calling.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity]),
    BillingModule,
    ProvidersModule,
    forwardRef(() => CallingModule),
  ],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
