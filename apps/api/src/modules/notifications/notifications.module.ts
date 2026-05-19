import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as firebaseAdmin from 'firebase-admin';
import { NotificationsService } from './notifications.service';
import { UserEntity } from '../users/entities/user.entity';

const FIREBASE_APP = 'FIREBASE_APP';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const serviceAccountJson = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        if (!serviceAccountJson) return null;
        if (firebaseAdmin.apps.length) return firebaseAdmin.apps[0];
        return firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(JSON.parse(serviceAccountJson)),
        });
      },
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule { }
