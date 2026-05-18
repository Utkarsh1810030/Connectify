import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderProfileEntity } from './entities/provider-profile.entity';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderProfileEntity])],
  providers: [ProvidersService],
  controllers: [ProvidersController],
  exports: [ProvidersService],
})
export class ProvidersModule {}
