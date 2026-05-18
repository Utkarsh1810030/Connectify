import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validateConfig } from '@connectify/config';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { BillingModule } from './modules/billing/billing.module';
import { ChatModule } from './modules/chat/chat.module';
import { CallingModule } from './modules/calling/calling.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { GatewaysModule } from './gateways/gateways.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        // Never sync in production — use migrations
        synchronize: config.get('NODE_ENV') === 'development',
        migrations: ['dist/infrastructure/database/postgres/migrations/*.js'],
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ScheduleModule.forRoot(),
    InfrastructureModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
    SessionsModule,
    BillingModule,
    ChatModule,
    CallingModule,
    RatingsModule,
    ModerationModule,
    NotificationsModule,
    AdminModule,
    GatewaysModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
