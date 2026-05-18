import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly isDev: boolean;

  constructor(private readonly config: ConfigService) {
    this.isDev = config.get('NODE_ENV') !== 'production';
  }

  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (this.isDev) {
      console.log(`[PUSH] userId=${userId} title="${title}" body="${body}"`, data);
      return;
    }
    // TODO: Integrate FCM Admin SDK
    // await firebaseAdmin.messaging().send({ token: deviceToken, notification: { title, body }, data });
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
