import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as firebaseAdmin from 'firebase-admin';
import { UserEntity } from '../users/entities/user.entity';

export const FIREBASE_APP = 'FIREBASE_APP';

@Injectable()
export class NotificationsService {
  private readonly isDev: boolean;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(FIREBASE_APP) private readonly firebaseApp: firebaseAdmin.app.App | null,
  ) {
    this.isDev = config.get('NODE_ENV') !== 'production';
  }

  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (this.isDev) {
      console.log(`[PUSH] userId=${userId} title="${title}" body="${body}"`, data);
      return;
    }
    if (!this.firebaseApp) return;

    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'fcmToken'] });
    if (!user?.fcmToken) return;

    try {
      await this.firebaseApp.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data,
      });
    } catch (err) {
      console.error(`[FCM] Push failed for userId=${userId}:`, err);
    }
  }

  async notifySessionRequest(userId: string, providerName: string): Promise<void> {
    await this.sendPush(userId, 'Session Request', `${providerName} wants to connect with you`);
  }

  async notifyLowBalance(userId: string, balance: number): Promise<void> {
    await this.sendPush(userId, 'Low Balance', `Your wallet balance is ₹${balance}. Top up to continue.`, { type: 'low_balance' });
  }

  async notifySessionEnded(userId: string, durationSec: number, amount: number): Promise<void> {
    const mins = Math.floor(durationSec / 60);
    await this.sendPush(userId, 'Session Ended', `Session lasted ${mins} min. ₹${amount} was charged.`, { type: 'session_ended' });
  }
}
