import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { WalletService } from './wallet.service';

@Injectable()
export class RazorpayService {
  private readonly client!: Razorpay;

  constructor(
    private readonly config: ConfigService,
    private readonly walletService: WalletService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID') ?? '';
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') ?? '';
    // Skip initializing client in dev when keys are not configured
    if (keyId) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createOrder(amount: number): Promise<{ orderId: string; amount: number; currency: string }> {
    const order = await this.client.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
    });
    return { orderId: order.id, amount, currency: 'INR' };
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', this.config.get<string>('RAZORPAY_KEY_SECRET')!)
      .update(body)
      .digest('hex');
    return expected === signature;
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET')!;
    const digest = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    if (digest !== signature) return; // silently ignore invalid webhook

    if (payload.event === 'payment.captured') {
      const { order_id, id: paymentId, amount, notes } = payload.payload.payment.entity;
      const userId = notes?.userId;
      if (userId) {
        await this.walletService.topUp(userId, amount / 100, paymentId);
      }
    }
  }
}
