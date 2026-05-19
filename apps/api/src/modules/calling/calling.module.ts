import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CallingService } from './calling.service';
import { CallingController } from './calling.controller';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SessionsModule)],
  controllers: [CallingController],
  providers: [CallingService],
  exports: [CallingService],
})
export class CallingModule { }
