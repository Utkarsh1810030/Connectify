import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CallingService } from './calling.service';

@Module({
  imports: [ConfigModule],
  providers: [CallingService],
  exports: [CallingService],
})
export class CallingModule { }
