export type TransactionType = 'topup' | 'debit' | 'earning' | 'payout' | 'refund';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}

export interface TopUpWalletDto {
  amount: number;
  razorpayOrderId?: string;
}

export interface Payout {
  id: string;
  providerId: string;
  amount: number;
  status: PayoutStatus;
  bankReference: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

export interface BillingTickEvent {
  sessionId: string;
  userId: string;
  providerId: string;
  amount: number;
  durationSec: number;
}
